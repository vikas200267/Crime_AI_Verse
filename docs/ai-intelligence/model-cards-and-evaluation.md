# CrimeVerse AI Model Cards And Evaluation Gates

## Model Governance Rule

No model is allowed to directly overwrite official FIR tables. Models produce
scores, candidates, extracted fields, explanations, and recommendations. Writes
to official tables require validation and, for sensitive changes, officer review.

## OCR Model Card

| Field | Decision |
| --- | --- |
| MVP model | PaddleOCR or EasyOCR |
| Production model | OCR router using PaddleOCR, cloud OCR, and layout-aware models |
| Inputs | uploaded PDF/image document |
| Outputs | text, layout blocks, page confidence |
| Official tables enriched | none directly |
| AI tables | `DocumentMetadata`, `OCRResult` |
| Human review | required for low confidence pages |
| Key metric | character error rate, field extraction accuracy |
| Security gate | malware scan and active-content stripping before OCR |

## Document Type Classifier

| Field | Decision |
| --- | --- |
| MVP model | rules plus keyword classifier |
| Production model | lightweight transformer or gradient boosted model over OCR/layout features |
| Inputs | title text, page layout, keywords, document metadata |
| Outputs | FIR, complaint, witness statement, chargesheet, arrest memo, report, unknown |
| Official tables enriched | none directly |
| Key metric | macro F1 |
| Acceptance gate | unknown if confidence below threshold |

## FIR NER And Extraction

| Field | Decision |
| --- | --- |
| MVP model | pretrained NER plus regex/rules |
| Production model | fine-tuned multilingual NER and relation extraction |
| Inputs | OCR text, layout spans |
| Outputs | complainant, victim, accused, officer, court, act, section, dates, locations |
| Official tables enriched | `CaseMaster`, `Victim`, `Accused`, `ComplainantDetails`, `ActSectionAssociation` |
| AI tables | `AIExtractionLog` |
| Metrics | entity-level precision, recall, F1 |
| Acceptance gate | field-level confidence and schema validation |

## Legal Section Classifier

| Field | Decision |
| --- | --- |
| MVP model | regex plus lookup validation |
| Production model | transformer classifier constrained by `Act`, `Section`, and `CrimeHeadActSection` |
| Inputs | BriefFacts, legal text, document type |
| Outputs | `ActCode`, `SectionCode`, `CrimeHeadID`, `CrimeSubHeadID` candidates |
| Metrics | top-1 accuracy, top-3 recall, invalid-pair rate |
| Explainability | cite text span and matching lookup rows |
| Safety gate | never output section not present in official lookup |

## Entity Resolution Model

| Field | Decision |
| --- | --- |
| MVP model | deterministic and fuzzy scoring |
| Production model | supervised pairwise matcher plus graph context |
| Inputs | names, aliases, phone, vehicle, address, age, gender, district, co-accused |
| Outputs | candidate `SAME_AS` links and confidence |
| Official tables enriched | none destructively |
| Graph output | candidate and approved `SAME_AS` edges |
| Metrics | pair precision, pair recall, cluster purity |
| Safety gate | human approval for high-impact merges |

## Hotspot Prediction Model

| Field | Decision |
| --- | --- |
| MVP model | HDBSCAN plus rolling density and boosted risk baseline |
| Production model | ensemble of spatial features, temporal forecasts, and risk models |
| Inputs | case coordinates, date/time, crime head, district, station |
| Outputs | hotspot center, radius, risk score, confidence |
| AI tables | `HotspotPrediction`, `PredictionResult` |
| Metrics | precision at K, recall of future incidents, spatial hit rate |
| Explainability | local density, recent growth, crime head mix, repeat-offender graph activity |

## District And Station Risk Model

| Field | Decision |
| --- | --- |
| MVP model | LightGBM or XGBoost |
| Production model | LightGBM/CatBoost ensemble with calibrated probabilities |
| Inputs | rolling crime counts, gravity, category, hotspot density, repeat offenders, process load |
| Outputs | 0-100 risk score |
| Metrics | ROC AUC, PR AUC, calibration error, alert precision |
| Explainability | SHAP feature contribution |
| Latency | sub-second from online features |

## Crime Volume Forecast

| Field | Decision |
| --- | --- |
| MVP model | Prophet or rolling seasonal baseline |
| Production model | Temporal Fusion Transformer after sufficient history |
| Inputs | daily counts by district/station/crime head and external calendar signals |
| Outputs | forecast count and confidence interval |
| Metrics | MAPE, RMSE, MAE |
| Explainability | trend, weekly seasonality, holidays/festivals |

## Anomaly Detection

| Field | Decision |
| --- | --- |
| MVP model | Isolation Forest plus rule checks |
| Production model | Isolation Forest, robust statistics, graph anomaly, and autoencoder ensemble |
| Inputs | case features, process features, timeline features, legal consistency features |
| Outputs | anomaly score, anomaly type, evidence |
| Metrics | analyst-confirmed precision, time-to-detection |
| Safety gate | anomaly means review, not guilt or misconduct |

## Recommendation Engine

| Field | Decision |
| --- | --- |
| MVP model | rule/ranking templates |
| Production model | learning-to-rank with causal impact estimates |
| Inputs | risk scores, hotspot types, graph signals, resources, constraints |
| Outputs | action, priority, confidence, explanation |
| Metrics | analyst acceptance rate, post-action risk change, false positive cost |
| Explainability | top drivers and expected effect |

## Simulation Engine

| Field | Decision |
| --- | --- |
| MVP model | scenario templates with calibrated effect sizes |
| Production model | causal inference and later reinforcement learning |
| Inputs | intervention type, district, unit, time, crime head, resource level |
| Outputs | baseline risk, projected risk, confidence interval |
| Metrics | historical backtest error, intervention outcome error |
| Safety gate | simulation is advisory and must show assumptions |

## Evaluation Gates

| Gate | Requirement |
| --- | --- |
| schema validity | model output only uses official lookup IDs and allowed fields |
| confidence | low confidence routes to review |
| explainability | every alert/recommendation has drivers |
| bias | sensitive attributes are not inferred and are monitored |
| drift | feature and prediction distributions monitored |
| security | prompt injection and poisoned data checks applied |
| audit | model name, version, source evidence, reviewer, and decision logged |

