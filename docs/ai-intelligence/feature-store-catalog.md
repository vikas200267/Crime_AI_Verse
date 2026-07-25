# CrimeVerse AI Feature Store Catalog

## Feature Store Principle

Every feature must be traceable to the official FIR schema or an approved
external context feed. The feature store is an AI projection. It is not the
system of record.

Feature definitions must carry:

- `feature_name`
- `source_tables`
- `source_columns`
- `entity_key`
- `time_key`
- `refresh_mode`
- `online_available`
- `pii_level`
- `model_consumers`
- `explanation_label`

## Entity Keys

| Entity | Key | Source |
| --- | --- | --- |
| Case | `CaseMasterID` | `CaseMaster.CaseMasterID` |
| Police station | `PoliceStationID` | `CaseMaster.PoliceStationID`, `Unit.UnitID` |
| District | `DistrictID` | `District.DistrictID`, `Unit.DistrictID` |
| Accused | `AccusedMasterID` | `Accused.AccusedMasterID` |
| Victim | `VictimMasterID` | `Victim.VictimMasterID` |
| Employee | `EmployeeID` | `Employee.EmployeeID` |
| Court | `CourtID` | `Court.CourtID` |
| Crime head | `CrimeHeadID` | `CrimeHead.CrimeHeadID` |
| Crime sub-head | `CrimeSubHeadID` | `CrimeSubHead.CrimeSubHeadID` |

## Case Features

| Feature | Source | Definition | Consumers | Online |
| --- | --- | --- | --- | --- |
| `case_registered_day_of_week` | `CaseMaster.CrimeRegisteredDate` | Day of week of FIR registration | trend, density | yes |
| `case_registered_month` | `CaseMaster.CrimeRegisteredDate` | Calendar month | seasonality | yes |
| `incident_hour_start` | `CaseMaster.IncidentFromDate` | Start hour of incident | hotspot, patrol | yes |
| `incident_duration_minutes` | `CaseMaster.IncidentFromDate`, `IncidentToDate` | Difference in minutes, capped and null-safe | severity, anomaly | yes |
| `reporting_delay_minutes` | `CaseMaster.IncidentFromDate`, `InfoReceivedPSDate` | Time from incident start to station information | anomaly, case risk | yes |
| `registration_delay_minutes` | `InfoReceivedPSDate`, `CrimeRegisteredDate` | Delay from police information to official registration date | anomaly | yes |
| `case_category_id` | `CaseMaster.CaseCategoryID` | Official case category | all tabular models | yes |
| `gravity_offence_id` | `CaseMaster.GravityOffenceID` | Official gravity | risk, alert | yes |
| `crime_major_head_id` | `CaseMaster.CrimeMajorHeadID` | Official major head | hotspot, trend | yes |
| `crime_minor_head_id` | `CaseMaster.CrimeMinorHeadID` | Official sub-head | category, hotspot | yes |
| `case_status_id` | `CaseMaster.CaseStatusID` | Official lifecycle state | aging, dashboard | yes |
| `brief_facts_embedding` | `CaseMaster.BriefFacts` | Sentence embedding of official narrative | similarity, duplicate | no for MVP |
| `brief_facts_mo_tokens` | `CaseMaster.BriefFacts` | Rule/NLP extracted method-of-operation tokens | graph, search | yes |

## Geospatial Features

| Feature | Source | Definition | Consumers | Online |
| --- | --- | --- | --- | --- |
| `incident_latitude` | `CaseMaster.latitude` | Validated latitude | hotspot | yes |
| `incident_longitude` | `CaseMaster.longitude` | Validated longitude | hotspot | yes |
| `incident_geohash_6` | `CaseMaster.latitude`, `longitude` | Geohash precision 6 | density | yes |
| `district_id` | `Unit.DistrictID` or geocode | Jurisdiction district | district risk | yes |
| `station_id` | `CaseMaster.PoliceStationID` | Registering police station | station risk | yes |
| `distance_to_recent_hotspot_meters` | `HotspotPrediction`, `CaseMaster` | Distance to nearest recent hotspot | hotspot, anomaly | yes |
| `rolling_density_7d_1km` | `CaseMaster` | Case count within 1 km in previous 7 days | hotspot | yes |
| `rolling_density_30d_3km` | `CaseMaster` | Case count within 3 km in previous 30 days | hotspot | yes |

## Person Features

| Feature | Source | Definition | Consumers | Online |
| --- | --- | --- | --- | --- |
| `victim_count` | `Victim.CaseMasterID` | Number of victims per case | severity | yes |
| `accused_count` | `Accused.CaseMasterID` | Number of accused per case | severity, graph | yes |
| `complainant_count` | `ComplainantDetails.CaseMasterID` | Number of complainants per case | duplicate | yes |
| `victim_age_avg` | `Victim.AgeYear` | Average explicit victim age | severity | yes |
| `accused_age_avg` | `Accused.AgeYear` | Average explicit accused age | repeat offender | yes |
| `victim_police_count` | `Victim.VictimPolice` | Count of police victims | priority | yes |
| `accused_prior_case_count` | graph/entity resolution | Approved prior linked cases | repeat offender | yes |
| `accused_cross_district_count` | graph/entity resolution | Distinct districts in linked cases | movement risk | yes |
| `co_accused_degree` | graph projection | Number of co-accused edges | gang detection | yes |
| `shared_phone_count` | extracted entities | Shared phone links across cases | hidden association | yes |
| `shared_vehicle_count` | extracted entities | Shared vehicle links across cases | hidden association | yes |

## Legal Features

| Feature | Source | Definition | Consumers | Online |
| --- | --- | --- | --- | --- |
| `act_count` | `ActSectionAssociation` | Distinct acts in case | severity | yes |
| `section_count` | `ActSectionAssociation` | Distinct sections in case | severity | yes |
| `has_high_gravity_section` | `ActSectionAssociation`, `Section` | Rule-based high-severity legal flag | risk | yes |
| `crime_head_section_consistency` | `CrimeHeadActSection` | Whether selected sections match crime head mapping | validation | yes |
| `legal_extraction_confidence` | `AIExtractionLog` | Model confidence for legal extraction | reviewer queue | yes |

## Process Features

| Feature | Source | Definition | Consumers | Online |
| --- | --- | --- | --- | --- |
| `arrest_delay_days` | `ArrestSurrender`, `CaseMaster` | First arrest/surrender date minus registration date | case risk | yes |
| `arrest_count` | `ArrestSurrender` | Number of arrest/surrender events | case progress | yes |
| `chargesheet_delay_days` | `ChargesheetDetails`, `CaseMaster` | First chargesheet date minus registration date | delay prediction | yes |
| `chargesheet_type` | `ChargesheetDetails.cstype` | A/B/C report type | outcome analysis | yes |
| `io_open_case_count` | `Employee`, `CaseMaster` | Active case count for IO/registering officer | workload | yes |
| `station_open_case_count` | `Unit`, `CaseMaster` | Active case count for station | workload, risk | yes |
| `court_pending_case_count` | `Court`, `CaseMaster` | Cases tied to court not closed | court analytics | batch |

## External Context Features

External features are optional and must be labeled as non-official context.

| Feature | Source | Use | MVP Strategy |
| --- | --- | --- | --- |
| `holiday_indicator` | government calendar | seasonality | static fixture |
| `festival_indicator` | local calendar | crowd-crime risk | static fixture |
| `rainfall_mm` | weather API | accident and mobility patterns | mock fixture |
| `temperature_c` | weather API | seasonal effects | mock fixture |
| `population_density` | census/open data | normalized risk | sample CSV |
| `road_density` | GIS/open data | vehicle theft/accident context | sample CSV |
| `patrol_density` | police resource system | recommendation ranking | simulated |
| `cctv_density` | city surveillance inventory | recommendation ranking | simulated |

## Feature Refresh Modes

| Mode | Use |
| --- | --- |
| realtime | Case/document update must reflect in predictions within seconds/minutes |
| hourly | dashboard and hotspot refresh |
| nightly | backfills, drift checks, long-window aggregates |
| ad hoc | simulation scenarios and judge demos |

## PII Handling

Names, phone numbers, addresses, caste, religion, victim details, and raw
document text are high-sensitivity features. Broad analytics should use derived
counts, hashes, embeddings with access control, or graph metadata rather than
raw PII.

