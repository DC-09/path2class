# Path2Class — Planning e Progettazione Tecnica

> Sistema di navigazione in realtà aumentata per campus universitario.
> PWA accessibile via QR code, con riconoscimento visivo (YOLO), overlay AR e assistente conversazionale (Generative AI).

---

# FASE 1 — PLANNING STRUTTURATO

---

## 1. Contesto del progetto

Path2Class è una Progressive Web App (PWA) pensata per guidare studenti e visitatori all'interno di un campus universitario. Il sistema funziona così:

1. **QR code fisici** sono posizionati in punti strategici del campus: ingressi principali, corridoi, snodi tra piani, aree comuni. Ciascun QR codifica un identificativo univoco della posizione (es. `building_A_floor_2_corridor_north`). Quando l'utente lo scansiona, il browser conosce immediatamente il suo punto di partenza.

2. **L'utente seleziona una destinazione** (aula, ufficio, laboratorio) da un elenco o tramite ricerca testuale. Il sistema calcola il percorso ottimale sul grafo interno del campus.

3. **In modalità AR**, la fotocamera dello smartphone mostra il mondo reale con sovrapposti frecce direzionali, indicatori di svolta, etichette di conferma ("Sei nel corridoio giusto") e notifiche ("Sali al piano 2"). Chi non vuole o non può usare la camera accede a una **modalità testuale fallback** con istruzioni passo-passo.

4. **Il modulo di Deep Learning (YOLO)** analizza i frame della fotocamera per riconoscere elementi fisici del campus — cartelli con numero di stanza, frecce di segnaletica, porte, scale, ascensori, landmark — e usa questi rilevamenti per confermare o correggere la posizione stimata dell'utente lungo il percorso.

5. **Il modulo di Generative AI** fornisce un'interfaccia conversazionale: spiega il percorso in linguaggio naturale, risponde a domande ("Dove sono?", "Ci sono ascensori?"), riformula le istruzioni in modo più semplice o in altre lingue (italiano, inglese, portoghese, ecc.), e assiste l'utente quando si perde.

6. I tre moduli — AR overlay, detection visiva, assistente linguistico — cooperano in un loop continuo: YOLO aggiorna la posizione, il motore di routing ricalcola se necessario, l'AR mostra le indicazioni aggiornate, e il chatbot risponde in base al contesto corrente.

---

## 2. Obiettivi per ciascun corso

### 2.1 Emerging Technologies — AR Layer

**Obiettivo**: realizzare un livello di realtà aumentata nel browser che sovrapponga indicazioni di navigazione al feed della fotocamera.

- **Tecnologia**: valutare WebXR Device API (standard W3C, supporto crescente su Android Chrome) con fallback su AR.js + Three.js per compatibilità più ampia. L'overlay può essere 2D (frecce e testi disegnati su canvas sovrapposto al video) o 3D (oggetti Three.js ancorati a punti stimati).
- **Funzionalità del layer**:
  - Frecce direzionali: avanti, destra, sinistra, dietrofront.
  - Indicatori di azione: "Sali al piano 2", "Usa l'ascensore sulla destra", "Attraversa la porta".
  - Conferme di posizione: "Sei nel corridoio dell'Aula 2.14".
  - Notifiche di arrivo: "Sei arrivato — l'aula è sulla tua sinistra".
- **Input necessari**: direzione di marcia stimata (bussola/giroscopio), prossimo nodo del grafo, bounding box dei landmark rilevati da YOLO.

### 2.2 Deep Learning — YOLO

**Obiettivo**: addestrare un modello di object detection per riconoscere elementi visivi del campus e usarli come "ancore" per la localizzazione indoor.

**Classi da riconoscere e relativo utilizzo**:

| Classe | Esempio fisico | Utilizzo per la navigazione |
|---|---|---|
| `sign_room_number` | Targa "Aula 2.14" | Conferma corridoio e posizione precisa |
| `sign_building_name` | Pannello "Edificio A — Dipartimento di Informatica" | Conferma edificio corretto |
| `direction_arrow` | Freccia di segnaletica a muro | Disambiguazione direzione nei bivi |
| `entrance_door` | Porta d'ingresso principale/secondaria | Conferma ingresso usato, punto di partenza alternativo |
| `elevator_door` | Porta dell'ascensore | Routing accessibile, cambio piano |
| `staircase` | Rampa di scale, icona scale | Cambio piano, alternativa all'ascensore |
| `ramp` | Rampa per disabili | Routing accessibile |
| `path2class_qr` | QR code Path2Class su muro | Re-localizzazione esatta (ogni QR ha coordinate note) |
| `campus_landmark` | Oggetti riconoscibili: bacheca grande, distributore, statua, caffetteria | Riferimento visivo per conferma di posizione |

### 2.3 Generative AI — Assistente conversazionale

**Obiettivo**: fornire un agente linguistico che conosce il campus e il percorso corrente, capace di assistere l'utente con risposte contestualizzate.

**Compiti principali**:

1. **Spiegazione del percorso**: descrivere i prossimi N passi in linguaggio naturale semplice ("Vai dritto per 30 metri, poi gira a destra dopo il distributore automatico").
2. **Riformulazione e adattamento**: ripetera le istruzioni in modo più semplice, più lento, o in un'altra lingua (EN, IT, PT, ES, ecc.).
3. **Assistenza quando l'utente si perde**: chiedere all'utente cosa vede, incrociare la descrizione con le detection YOLO e il grafo, proporre un riallineamento.
4. **Informazioni di accessibilità**: indicare percorsi alternativi senza scale, segnalare ascensori e rampe.
5. **Domande generiche sul campus**: orari, posizione di servizi (bagni, segreteria, bar), informazioni contestuali.

**Il modello deve essere "grounded" su**: grafo del campus, posizione corrente stimata, step rimanenti del percorso, detection recenti di YOLO, barriere architettoniche note.

### 2.4 Integrazione dei tre moduli — Flusso end-to-end

```
QR scan → posizione iniziale nota
    ↓
Selezione destinazione → calcolo percorso su grafo
    ↓
Loop di navigazione:
    ├─ Frame camera → YOLO detection → aggiornamento posizione
    ├─ Posizione + percorso → AR overlay (frecce, indicatori)
    ├─ Utente chiede aiuto → GenAI riceve contesto + domanda → risposta
    └─ Se deviazione rilevata → ricalcolo percorso → aggiornamento AR + notifica
    ↓
Arrivo a destinazione → notifica + chiusura sessione
```

- **YOLO** alimenta il modulo di localizzazione con le detection.
- **Il routing engine** consuma la posizione stimata e produce la lista di step e il prossimo nodo.
- **L'AR layer** consuma il prossimo nodo + le bounding box per posizionare gli overlay.
- **Il modulo GenAI** consuma tutto il contesto (posizione, percorso, detection, lingua) e produce risposte testuali/vocali.

---

## 3. Mappa dei casi d'uso principali

### Caso d'uso 1 — Studente Erasmus in ritardo

- **Contesto**: Uno studente Erasmus arriva in ritardo. Deve trovare l'Aula 3.07 al terzo piano dell'Edificio B. Non conosce il campus e parla inglese.
- **Punto di ingresso**: Scansiona il QR all'ingresso principale dell'Edificio B (`building_B_floor_0_entrance_main`).
- **Flusso**:
  1. L'app mostra l'elenco delle aule; lo studente cerca "3.07".
  2. Il routing calcola: ingresso → corridoio piano terra → scale/ascensore → corridoio piano 3 → Aula 3.07.
  3. L'AR mostra una freccia avanti lungo il corridoio, poi una freccia verso le scale.
  4. YOLO rileva `staircase` → l'app conferma "Sali al piano 3".
  5. Al piano 3, YOLO rileva `sign_room_number: 3.07` → "Sei arrivato".
  6. Lo studente chiede via chat: "Which door is it?" → GenAI risponde in inglese basandosi sulla detection.

### Caso d'uso 2 — Visitatore per una conferenza (ingresso sbagliato)

- **Contesto**: Un visitatore entra dall'ingresso laterale dell'Edificio A pensando di essere nell'Edificio C.
- **Punto di ingresso**: QR all'ingresso laterale (`building_A_floor_0_entrance_side`).
- **Flusso**:
  1. Il visitatore cerca "Sala Conferenze C.01". L'app calcola il percorso dall'Edificio A all'Edificio C.
  2. Il routing include un tratto esterno o un corridoio di collegamento tra edifici.
  3. YOLO rileva `sign_building_name: Edificio A` → conferma la posizione e che serve spostarsi.
  4. L'AR guida verso l'uscita e poi verso l'Edificio C.
  5. Il visitatore chiede: "Quanto manca?" → GenAI fornisce una stima in step rimanenti.

### Caso d'uso 3 — Persona con mobilità ridotta

- **Contesto**: Una persona in sedia a rotelle deve raggiungere il laboratorio al piano 1.
- **Punto di ingresso**: QR nell'atrio principale.
- **Flusso**:
  1. L'utente seleziona "Laboratorio 1.12" e indica "percorso accessibile" (o l'app lo chiede).
  2. Il routing esclude scale e sceglie ascensori e rampe.
  3. YOLO rileva `elevator_door` → l'AR indica "Usa questo ascensore, vai al piano 1".
  4. Se l'ascensore è fuori servizio (informazione manuale nel sistema), GenAI avvisa e ricalcola verso un'altra via accessibile.

### Caso d'uso 4 — Utente che si perde e chiede aiuto

- **Contesto**: Uno studente ha seguito metà percorso ma ha preso una svolta sbagliata. Non riconosce dove si trova.
- **Punto di ingresso**: Sessione già attiva, posizione stimata incoerente.
- **Flusso**:
  1. L'utente apre la chat: "Mi sono perso, non so dove sono."
  2. GenAI chiede: "Puoi inquadrare un cartello o un QR nelle vicinanze?"
  3. L'utente punta la camera → YOLO rileva `sign_room_number: 1.22`.
  4. Il sistema aggiorna la posizione al corridoio dell'aula 1.22 e ricalcola il percorso.
  5. L'AR mostra le nuove indicazioni; GenAI conferma: "Ora sei al primo piano vicino all'aula 1.22. Procedi dritto e gira a destra."

### Caso d'uso 5 — Utente che richiede traduzione

- **Contesto**: Uno studente brasiliano vuole le istruzioni in portoghese.
- **Flusso**:
  1. L'utente scrive: "Pode me explicar em português?"
  2. GenAI rileva la lingua e switcha le risposte in portoghese.
  3. Tutte le istruzioni successive vengono fornite in PT-BR.
  4. L'AR overlay rimane nelle icone universali (frecce), ma le etichette testuali si adattano alla lingua.

---

## 4. Vincoli e assunzioni tecniche

### 4.1 Dispositivo dell'utente
- Smartphone di fascia media (2–3 anni), Android o iOS.
- Browser moderno: Chrome 90+ (Android), Safari 15+ (iOS).
- L'utente concede i permessi per la fotocamera.
- Giroscopio e accelerometro disponibili (presenti su quasi tutti gli smartphone).
- GPS non affidabile in ambienti indoor (non utilizzato come fonte primaria).

### 4.2 Connettività
- Connessione Wi-Fi del campus o rete mobile (4G/5G).
- Assunzione: banda sufficiente per chiamate API (JSON leggero, ~1–5 KB per richiesta).
- Se YOLO gira server-side: banda sufficiente per inviare frame compressi (JPEG quality 60, ~30–80 KB per frame, 1–2 fps).
- Considerare brevi periodi di latenza elevata o disconnessione:
  - le ultime indicazioni note rimangono visibili;
  - il modello GenAI può rispondere con dati cached;
  - le detection YOLO client-side continuano a funzionare offline.

### 4.3 Esecuzione di YOLO
- **Opzione A — Server-side** (consigliata per MVP): l'app invia frame al backend, il server esegue inference con GPU e restituisce risultati in ~100–200 ms.
- **Opzione B — Client-side** (obiettivo a lungo termine): modello esportato in ONNX, eseguito via `onnxruntime-web` con backend WebGPU/WASM. Richiede modello molto leggero (YOLOv8n) e risoluzione ridotta (320×320 o 416×416).
- Il prototipo parte con opzione A; l'opzione B viene valutata come ottimizzazione successiva.

### 4.4 Formato dati tra moduli

Tutti i moduli comunicano tramite JSON. Struttura tipo del contesto condiviso:

```json
{
  "session_id": "abc-123",
  "user_position": {
    "node_id": "building_A_floor_2_corridor_north",
    "building": "A",
    "floor": 2,
    "confidence": 0.85,
    "last_updated": "2026-04-15T10:32:05Z"
  },
  "destination": {
    "node_id": "building_A_floor_3_room_307",
    "label": "Aula 3.07"
  },
  "route": {
    "remaining_steps": [
      {"node_id": "building_A_floor_2_stairs_east", "action": "go_to_stairs", "label": "Vai verso le scale est"},
      {"node_id": "building_A_floor_3_corridor_east", "action": "climb_stairs", "label": "Sali al piano 3"},
      {"node_id": "building_A_floor_3_room_307", "action": "turn_left", "label": "Gira a sinistra, Aula 3.07"}
    ]
  },
  "recent_detections": [
    {"class": "sign_room_number", "label": "2.14", "confidence": 0.92, "bbox": [120, 80, 210, 130]},
    {"class": "direction_arrow", "label": "right", "confidence": 0.88, "bbox": [300, 60, 350, 100]}
  ],
  "user_language": "en",
  "accessibility": {"avoid_stairs": false}
}
```

### 4.5 Grafo del campus
- Modellato come un grafo pesato: nodi = posizioni discrete (ingressi, incroci di corridoi, porte, scale, ascensori, stanze); archi = percorsi percorribili con attributi (distanza, tipo: corridoio/scala/ascensore/rampa/esterno, accessibile sì/no).
- Memorizzato in un database (o file JSON per MVP) e caricato dal backend.
- Il routing usa un algoritmo di shortest path (Dijkstra o A*) con possibilità di escludere archi non accessibili.

---

## 5. Output della Fase 1 — Riepilogo del planning

### A. Componenti del sistema
1. **PWA Front-end**: camera, AR overlay, UI navigazione, chat, gestione QR, service worker per offline.
2. **Backend di routing**: grafo del campus, calcolo percorsi, gestione sessioni.
3. **Servizio YOLO**: inference su frame, restituzione detection.
4. **Servizio GenAI**: assistente conversazionale contestualizzato.
5. **Database/Config**: mappa del campus (nodi, archi, metadati), configurazione QR, informazioni accessibilità.

### B. Flusso principale
1. Scansione QR → posizione iniziale.
2. Selezione destinazione → calcolo percorso.
3. Loop: detection YOLO → aggiornamento posizione → AR overlay → supporto GenAI su richiesta.
4. Arrivo → chiusura sessione.

### C. Vincoli chiave
- Browser-based, no app nativa.
- YOLO server-side per MVP, client-side come evoluzione.
- GenAI grounded su contesto strutturato, non su conoscenza generica.
- Supporto multilingua e accessibilità fin dal design.

### D. Deliverable per corso
- **Emerging Technologies**: prototipo AR nel browser con overlay di navigazione.
- **Deep Learning**: modello YOLO addestrato su classi del campus, pipeline di training, API di inference.
- **Generative AI**: agente conversazionale con system prompt strutturato, integrato nel flusso di navigazione.

---
---

# FASE 2 — PROGETTAZIONE TECNICA ED ESECUTIVA

---

## 2.1 Deep Learning con YOLO

### 2.1.1 Definizione del problema di visione

Il task è **object detection multi-classe**: dato un frame della fotocamera dello smartphone, il modello deve localizzare (bounding box) e classificare gli oggetti rilevanti per la navigazione.

Non si tratta di segmentazione semantica (non serve la forma esatta) né di semplice classificazione (serve sapere *dove* nell'immagine si trova l'oggetto). La detection fornisce:
- **Classe** dell'oggetto.
- **Bounding box** (coordinate nel frame).
- **Confidence score**.

**Classi definitive e utilizzo**:

| ID | Classe | Descrizione | Uso nella localizzazione |
|----|--------|-------------|--------------------------|
| 0 | `sign_room_number` | Targa con numero di stanza/aula | Localizzazione precisa: il numero letto (con OCR opzionale o label noto) mappa a un nodo del grafo |
| 1 | `sign_building_name` | Pannello con nome dell'edificio | Conferma edificio corrente |
| 2 | `direction_arrow` | Freccia di segnaletica fisica | Aiuto nella disambiguazione di bivi; la direzione della freccia può confermare il percorso |
| 3 | `entrance_door` | Porta d'ingresso (principale o secondaria) | Conferma ingresso, transizione interno/esterno |
| 4 | `elevator_door` | Porta di ascensore | Conferma vicinanza ascensore, trigger per cambio piano |
| 5 | `staircase` | Scale o icona scale | Conferma vicinanza scale, trigger per cambio piano |
| 6 | `ramp` | Rampa accessibile | Conferma percorso accessibile |
| 7 | `path2class_qr` | QR code del sistema Path2Class | Re-localizzazione esatta (ogni QR ha coordinate hardcoded) |
| 8 | `campus_landmark` | Oggetti riconoscibili (bacheca, distributore, caffetteria, statua, ecc.) | Riferimento visivo per triangolazione approssimativa |

> **Nota**: il riconoscimento del *contenuto testuale* delle targhe (es. leggere "2.14" dalla targa) può essere delegato a un modulo OCR separato che agisce sulle regioni ritagliate dal bounding box di `sign_room_number`. Questo è un'estensione opzionale: per l'MVP, il modello rileva la *presenza* di una targa e la posizione approssimativa è sufficiente.

### 2.1.2 Dataset e raccolta dati

#### Piano di raccolta

La raccolta avviene fisicamente nel campus con smartphone, in sessioni organizzate:

| Sessione | Target | Dettagli |
|----------|--------|----------|
| 1. Corridoi e targhe | `sign_room_number`, `direction_arrow` | Foto ogni 2–3 metri nei corridoi, da angolazioni diverse (frontale, 30°, 45°). Luce naturale e artificiale |
| 2. Scale e ascensori | `staircase`, `elevator_door`, `ramp` | Foto dall'approccio (5m, 3m, 1m), con e senza persone parzialmente coprenti |
| 3. Ingressi | `entrance_door`, `sign_building_name` | Foto interne ed esterne, porte aperte e chiuse |
| 4. Landmark | `campus_landmark` | Foto dei punti di riferimento noti, diverse ore del giorno |
| 5. QR code | `path2class_qr` | QR stampati e posizionati, foto a varie distanze (0.5m–3m) |

**Variabilità necessaria**:
- Angolazioni: frontale, laterale (±45°), dal basso (utente seduto).
- Illuminazione: luce naturale (mattina, pomeriggio), luce artificiale (neon), controluce da finestre.
- Occlusioni parziali: persone che passano, zaini, porte semiaperte.
- Distanza: vicino (1m), medio (3m), lontano (5–7m).
- Sfocatura leggera: simulazione di movimento.

**Volume target**: 1500–3000 immagini totali, con almeno 100–200 immagini annotate per classe. Le classi meno frequenti (es. `ramp`) possono avere meno campioni ma vanno bilanciate con data augmentation.

#### Annotazione in formato YOLO

Ogni immagine `img_001.jpg` ha un file `img_001.txt` corrispondente. Ogni riga del file `.txt` rappresenta un oggetto:

```
<class_id> <x_center> <y_center> <width> <height>
```

Tutti i valori sono normalizzati [0, 1] rispetto alle dimensioni dell'immagine.

**Esempio**: un'immagine 1280×720 con una targa "Aula 2.14" il cui bounding box ha angolo top-left (200, 300) e bottom-right (400, 380):

```
0 0.234375 0.472222 0.15625 0.111111
```

Calcolo:
- `x_center` = (200+400)/2 / 1280 = 0.234375
- `y_center` = (300+380)/2 / 720 = 0.472222
- `width` = (400-200) / 1280 = 0.15625
- `height` = (380-300) / 720 = 0.111111

**Strumenti consigliati per annotazione**: [LabelImg](https://github.com/HumanSignal/labelImg) (supporta formato YOLO nativo), [Roboflow](https://roboflow.com) (interfaccia web, esportazione YOLO), CVAT.

#### Suddivisione dataset

| Set | Percentuale | Scopo |
|-----|-------------|-------|
| Train | 70% | Addestramento del modello |
| Validation | 20% | Tuning iperparametri, early stopping |
| Test | 10% | Valutazione finale, mai visto in training |

Suddivisione stratificata: ogni set deve contenere proporzioni simili di ciascuna classe. Evitare che immagini dallo stesso corridoio finiscano sia in train che in test (split per location, non per immagine random).

### 2.1.3 Scelta e configurazione del modello YOLO

#### Variante consigliata: YOLOv8n (nano)

- **Perché YOLOv8**: architettura moderna (Ultralytics, 2023+), ottimo rapporto accuracy/velocità, supporto nativo per export ONNX/TFLite/CoreML, API Python pulita.
- **Perché la variante "nano"**: ~3.2M parametri, ~8.7 GFLOPs. Abbastanza leggera per inference rapida sia su server (con GPU) che potenzialmente su device (via ONNX). Per un prototipo accademico è un ottimo compromesso.
- **Alternativa**: YOLOv8s (small, ~11.2M parametri) se la nano non raggiunge mAP sufficiente sulle classi più difficili.

#### Fine-tuning

Il modello parte dai pesi **pretrained su COCO** (80 classi generiche). Il fine-tuning trasferisce le feature di basso livello (bordi, texture, forme) apprese su COCO alle nostre 9 classi specifiche.

**File di configurazione del dataset** (`campus_dataset.yaml`):

```yaml
# campus_dataset.yaml
path: ./datasets/campus
train: images/train
val: images/val
test: images/test

nc: 9  # numero di classi
names:
  0: sign_room_number
  1: sign_building_name
  2: direction_arrow
  3: entrance_door
  4: elevator_door
  5: staircase
  6: ramp
  7: path2class_qr
  8: campus_landmark
```

**Iperparametri principali**:

| Parametro | Valore suggerito | Note |
|-----------|-----------------|------|
| `model` | `yolov8n.pt` | Pesi pretrained COCO |
| `epochs` | 100–150 | Con early stopping (patience 15–20) |
| `batch` | 16–32 | Dipende dalla VRAM GPU disponibile |
| `imgsz` | 640 | Standard per YOLOv8 |
| `lr0` | 0.01 | Learning rate iniziale |
| `lrf` | 0.001 | Learning rate finale (cosine decay) |
| `optimizer` | AdamW | Default YOLOv8 |
| `augment` | True | Attiva augmentation integrata |

**Data augmentation** (configurata nel training YOLOv8):
- `hsv_h`: 0.015 (variazione tonalità)
- `hsv_s`: 0.7 (variazione saturazione)
- `hsv_v`: 0.4 (variazione luminosità)
- `degrees`: 10.0 (rotazione ±10°)
- `translate`: 0.1 (traslazione ±10%)
- `scale`: 0.5 (scaling ±50%)
- `flipud`: 0.0 (no flip verticale — i cartelli hanno orientamento fisso)
- `fliplr`: 0.5 (flip orizzontale 50%)
- `mosaic`: 1.0 (mosaic augmentation attivo)
- `blur`: 0.01 (leggera sfocatura occasionale)

#### Monitoraggio del training

**Metriche da monitorare**:
- **mAP@0.5**: mean Average Precision a IoU 0.5 — metrica principale.
- **mAP@0.5:0.95**: mAP mediata su IoU da 0.5 a 0.95 — metrica più stringente.
- **Precision e Recall per classe**: identificare classi problematiche.
- **Loss curves**: box_loss, cls_loss, dfl_loss — devono decrescere e stabilizzarsi.
- **Confusion matrix**: verificare le confusioni tra classi simili (es. `entrance_door` vs `elevator_door`).

**Strumenti**: Ultralytics fornisce log TensorBoard integrato. In alternativa, Weights & Biases (wandb) per tracking remoto.

**Criteri di successo**:
- mAP@0.5 ≥ 0.75 complessivo.
- Precision ≥ 0.80 per le classi critiche (`sign_room_number`, `path2class_qr`).
- Recall ≥ 0.70 per tutte le classi.

### 2.1.4 Deploy del modello

#### Opzione A — Server-side (consigliata per MVP)

L'app PWA cattura frame dalla camera, li comprime in JPEG e li invia al backend via API REST.

**Flusso**:
```
Smartphone (frame JPEG) → POST /api/detect → Server (YOLO inference GPU) → JSON response
```

**Endpoint API**:

```
POST /api/detect
Content-Type: multipart/form-data

Request:
  - image: file JPEG (quality 60-70, risoluzione 640×480 o 640×640)
  - session_id: string (opzionale, per logging)

Response (200 OK):
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "sign_room_number",
      "confidence": 0.92,
      "bbox": {
        "x1": 120, "y1": 80,
        "x2": 340, "y2": 180
      }
    },
    {
      "class_id": 5,
      "class_name": "staircase",
      "confidence": 0.87,
      "bbox": {
        "x1": 400, "y1": 200,
        "x2": 600, "y2": 450
      }
    }
  ],
  "inference_time_ms": 45,
  "image_size": [640, 480]
}
```

**Pro**: inference veloce (~30–80 ms su GPU), modello di qualsiasi dimensione, facile da aggiornare.
**Contro**: richiede connettività, latenza di rete (~50–200 ms aggiuntivi), costo server GPU.

**Pseudo-codice server (Python/FastAPI)**:

```python
from fastapi import FastAPI, UploadFile
from ultralytics import YOLO
import cv2
import numpy as np
import time

app = FastAPI()
model = YOLO("best_campus.pt")  # modello addestrato

@app.post("/api/detect")
async def detect(image: UploadFile, session_id: str = None):
    # Leggi e decodifica l'immagine
    contents = await image.read()
    np_arr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # Inference
    start = time.time()
    results = model(frame, conf=0.5, iou=0.45)
    inference_ms = (time.time() - start) * 1000

    # Parsing risultati
    detections = []
    for box in results[0].boxes:
        detections.append({
            "class_id": int(box.cls[0]),
            "class_name": model.names[int(box.cls[0])],
            "confidence": round(float(box.conf[0]), 3),
            "bbox": {
                "x1": int(box.xyxy[0][0]),
                "y1": int(box.xyxy[0][1]),
                "x2": int(box.xyxy[0][2]),
                "y2": int(box.xyxy[0][3])
            }
        })

    return {
        "detections": detections,
        "inference_time_ms": round(inference_ms, 1),
        "image_size": [frame.shape[1], frame.shape[0]]
    }
```

#### Opzione B — Client-side (evoluzione futura)

Il modello viene esportato in formato ONNX e caricato nel browser tramite `onnxruntime-web`.

**Flusso**:
```
Smartphone (frame canvas) → onnxruntime-web (WASM/WebGPU) → JSON detections locali
```

**Passi di esportazione**:
```python
from ultralytics import YOLO

model = YOLO("best_campus.pt")
model.export(format="onnx", imgsz=320, simplify=True, opset=17)
# Produce: best_campus.onnx (~6-12 MB per YOLOv8n)
```

**Pseudo-codice client (JavaScript)**:

```javascript
import * as ort from 'onnxruntime-web';

// Caricamento modello (una sola volta)
const session = await ort.InferenceSession.create('./models/best_campus.onnx', {
  executionProviders: ['webgpu', 'wasm']  // fallback WASM se WebGPU non disponibile
});

async function detectFrame(videoElement) {
  // Preprocessing: resize a 320x320, normalizza [0,1], formato NCHW
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, 320, 320);
  const imageData = ctx.getImageData(0, 0, 320, 320);

  // Converti in tensor Float32 [1, 3, 320, 320]
  const float32Data = new Float32Array(1 * 3 * 320 * 320);
  for (let i = 0; i < 320 * 320; i++) {
    float32Data[i]                = imageData.data[i * 4] / 255.0;     // R
    float32Data[320*320 + i]      = imageData.data[i * 4 + 1] / 255.0; // G
    float32Data[2 * 320*320 + i]  = imageData.data[i * 4 + 2] / 255.0; // B
  }

  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 320, 320]);
  const results = await session.run({ images: inputTensor });

  // Post-processing: NMS e parsing (dipende dal formato di output ONNX)
  return parseDetections(results);
}
```

**Pro**: funziona offline, nessuna latenza di rete, nessun costo server.
**Contro**: inference più lenta (~200–500 ms su WASM, ~80–150 ms su WebGPU), risoluzione limitata, consumo batteria, WebGPU non supportato ovunque.

**Confronto sintetico**:

| Criterio | Server-side | Client-side |
|----------|-------------|-------------|
| Latenza totale | 150–300 ms (rete + inference) | 100–500 ms (solo inference) |
| Offline | No | Sì |
| Qualità detection | Alta (640px, modello grande possibile) | Media (320px, solo nano) |
| Costo infrastruttura | Server con GPU | Nessuno |
| Complessità | Media (API REST) | Alta (ONNX + post-processing JS) |
| Raccomandazione | **MVP** | Evoluzione futura |

### 2.1.5 Fusione con la mappa del campus

#### Logica di aggiornamento posizione

Il modulo di localizzazione mantiene una **stima della posizione corrente** (nodo del grafo + confidence). Le detection YOLO aggiornano questa stima secondo regole:

```python
# Pseudo-codice: aggiornamento posizione basato su detection

def update_position(current_position, detections, campus_graph):
    """
    current_position: {node_id, building, floor, confidence}
    detections: lista di {class_name, label, confidence, bbox}
    campus_graph: grafo del campus con metadati per nodo
    """

    for det in detections:
        if det.confidence < 0.6:
            continue  # ignora detection poco affidabili

        if det.class_name == "path2class_qr":
            # Re-localizzazione esatta: il QR ha coordinate hardcoded
            qr_data = decode_qr_from_bbox(det.bbox)
            if qr_data and qr_data.node_id in campus_graph:
                current_position.node_id = qr_data.node_id
                current_position.confidence = 0.99
                current_position.floor = campus_graph[qr_data.node_id].floor
                return current_position

        elif det.class_name == "sign_room_number":
            # Cerca nel grafo quale nodo è associato a questa stanza
            room_label = extract_room_label(det)  # OCR o matching
            candidate_nodes = campus_graph.find_nodes_near_room(room_label)
            if candidate_nodes:
                best = candidate_nodes[0]  # il più vicino alla posizione corrente
                current_position.node_id = best.node_id
                current_position.floor = best.floor
                current_position.confidence = min(0.95, det.confidence)

        elif det.class_name == "staircase":
            # Se il percorso prevede un cambio piano e vedo le scale → conferma
            if route_expects_stairs(current_position):
                current_position.confidence = max(current_position.confidence, 0.80)

        elif det.class_name == "elevator_door":
            # Simile a staircase
            nearby_elevators = campus_graph.find_nearby(
                current_position.node_id, type="elevator"
            )
            if nearby_elevators:
                current_position.node_id = nearby_elevators[0].node_id
                current_position.confidence = max(current_position.confidence, 0.85)

        elif det.class_name == "campus_landmark":
            # Conferma approssimativa di zona
            landmark_nodes = campus_graph.find_landmark_nodes(det.label)
            if landmark_nodes:
                closest = find_closest_to(current_position, landmark_nodes)
                current_position.node_id = closest.node_id
                current_position.confidence = max(current_position.confidence, 0.75)

    # Decay della confidence se nessuna detection utile
    if not any_useful_detection:
        current_position.confidence *= 0.95  # decadimento graduale

    return current_position
```

#### Trigger di ricalcolo percorso

Se la posizione aggiornata non è coerente con il percorso atteso (l'utente è in un nodo non previsto), il sistema:
1. Ricalcola il percorso dalla nuova posizione alla destinazione.
2. Aggiorna l'AR overlay.
3. Notifica l'utente: "Percorso aggiornato".

### 2.1.6 Output della sezione YOLO — Deliverable

| Deliverable | Formato | Descrizione |
|-------------|---------|-------------|
| `campus_dataset.yaml` | YAML | Configurazione dataset per Ultralytics |
| `datasets/campus/` | Directory | Immagini + annotazioni .txt in formato YOLO |
| `train_campus.py` | Python | Script di training completo |
| `best_campus.pt` | PyTorch | Pesi del modello addestrato (migliore mAP val) |
| `best_campus.onnx` | ONNX | Modello esportato per deploy client-side |
| `server/detect_api.py` | Python/FastAPI | Endpoint di inference server-side |
| `evaluation_report.md` | Markdown | mAP, precision, recall per classe, confusion matrix |
| `training_notebook.ipynb` | Jupyter | Notebook con training, grafici, analisi errori |

**Pseudo-codice completo di training**:

```python
# train_campus.py
from ultralytics import YOLO

def main():
    # 1. Carica modello pretrained
    model = YOLO("yolov8n.pt")

    # 2. Fine-tuning sul dataset campus
    results = model.train(
        data="campus_dataset.yaml",
        epochs=120,
        batch=16,
        imgsz=640,
        patience=20,         # early stopping
        lr0=0.01,
        lrf=0.001,
        optimizer="AdamW",
        augment=True,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        mosaic=1.0,
        project="runs/campus",
        name="yolov8n_campus"
    )

    # 3. Valutazione sul test set
    metrics = model.val(data="campus_dataset.yaml", split="test")
    print(f"mAP@0.5: {metrics.box.map50:.3f}")
    print(f"mAP@0.5:0.95: {metrics.box.map:.3f}")

    # 4. Esportazione ONNX
    model.export(format="onnx", imgsz=640, simplify=True)
    model.export(format="onnx", imgsz=320, simplify=True)  # versione leggera per client

if __name__ == "__main__":
    main()
```

---

## 2.2 AR Layer (Emerging Technologies)

### 2.2.1 Scelta della tecnologia AR web

#### Opzioni valutate

| Tecnologia | Descrizione | Pro | Contro |
|------------|-------------|-----|--------|
| **WebXR Device API** | Standard W3C per AR/VR nel browser. Richiede supporto nativo del browser | Ancoraggi 3D reali (hit-test), tracking ambientale, standard futuro | Supporto iOS Safari ancora limitato (2026), richiede HTTPS |
| **AR.js + Three.js** | Libreria open-source per AR marker-based e location-based nel browser | Ampia compatibilità, marker-based molto stabile, setup rapido | Marker-based richiede marker fisici visibili, location-based usa GPS (inaffidabile indoor) |
| **Three.js + overlay 2D su video** | Video feed della camera + canvas HTML5 sovrapposto con disegni 2D/3D | Massima compatibilità browser, pieno controllo, nessuna dipendenza AR esterna | Nessun tracking ambientale reale, frecce non ancorate al mondo 3D |

#### Scelta guida: approccio ibrido a due livelli

**Livello primario (prototipo)**: **Three.js + overlay 2D su video stream**. Il video della camera è lo sfondo; sopra, un canvas HTML5 o una scena Three.js renderizza frecce, testi e indicatori. La posizione degli overlay è determinata da:
- La direzione stimata (giroscopio/bussola del dispositivo).
- Le bounding box di YOLO (es. freccia "gira a destra" posizionata vicino alla porta rilevata).
- Il prossimo step del percorso.

**Livello avanzato (evoluzione)**: **WebXR** dove supportato, per ancoraggi 3D più precisi e hit-test. L'app rileva il supporto WebXR e attiva il livello avanzato se disponibile.

> Questa scelta massimizza la **compatibilità** (funziona su qualsiasi browser con accesso camera) garantendo un'esperienza AR funzionale, pur lasciando spazio a miglioramenti con WebXR.

### 2.2.2 Flusso tecnico dell'AR layer

#### Step 1 — Accesso alla camera

```javascript
// Richiesta permesso e accesso al video stream
async function startCamera() {
  const constraints = {
    video: {
      facingMode: 'environment',   // camera posteriore
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const videoElement = document.getElementById('camera-feed');
  videoElement.srcObject = stream;
  await videoElement.play();
  return videoElement;
}
```

#### Step 2 — Orientamento del dispositivo

```javascript
// Lettura bussola e giroscopio per stimare la direzione di marcia
let currentHeading = 0;

function startOrientationTracking() {
  if ('DeviceOrientationEvent' in window) {
    // iOS richiede permesso esplicito
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', onOrientation);
        }
      });
    } else {
      window.addEventListener('deviceorientation', onOrientation);
    }
  }
}

function onOrientation(event) {
  // alpha = rotazione attorno asse Z (bussola: 0-360)
  // beta  = inclinazione avanti/indietro
  // gamma = inclinazione sinistra/destra
  if (event.webkitCompassHeading) {
    currentHeading = event.webkitCompassHeading;  // iOS
  } else if (event.alpha) {
    currentHeading = 360 - event.alpha;  // Android (approssimazione)
  }
}
```

#### Step 3 — Rendering degli overlay AR

```javascript
// Overlay manager: decide cosa mostrare e dove
class AROverlayManager {
  constructor(canvasElement, videoWidth, videoHeight) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
  }

  /**
   * Aggiorna gli overlay basandosi sullo stato di navigazione
   * @param {Object} navState - stato corrente (prossimo step, detection, heading)
   */
  render(navState) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const nextStep = navState.nextStep;
    const detections = navState.detections;

    // 1. Freccia direzionale principale (centro-basso dello schermo)
    if (nextStep) {
      this.drawDirectionArrow(nextStep.action, nextStep.label);
    }

    // 2. Highlight sugli oggetti rilevati da YOLO
    for (const det of detections) {
      if (det.class_name === 'staircase' && nextStep?.action === 'climb_stairs') {
        this.drawHighlight(det.bbox, 'Sali qui', '#00FF88');
      }
      if (det.class_name === 'elevator_door' && nextStep?.action === 'use_elevator') {
        this.drawHighlight(det.bbox, 'Usa ascensore', '#00AAFF');
      }
      if (det.class_name === 'entrance_door' && nextStep?.action === 'exit_door') {
        this.drawHighlight(det.bbox, 'Esci da qui', '#FFAA00');
      }
    }

    // 3. Notifica di conferma posizione
    if (navState.positionConfirmed) {
      this.drawNotification('Sei sul percorso giusto', '#00FF88');
    }
  }

  drawDirectionArrow(action, label) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height * 0.75;

    this.ctx.save();
    this.ctx.translate(cx, cy);

    // Ruota la freccia in base all'azione
    let rotation = 0;
    if (action === 'turn_right') rotation = Math.PI / 2;
    else if (action === 'turn_left') rotation = -Math.PI / 2;
    else if (action === 'go_back') rotation = Math.PI;
    // 'go_straight' = 0

    this.ctx.rotate(rotation);

    // Disegna freccia
    this.ctx.fillStyle = 'rgba(0, 200, 100, 0.8)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -40);
    this.ctx.lineTo(25, 10);
    this.ctx.lineTo(10, 10);
    this.ctx.lineTo(10, 40);
    this.ctx.lineTo(-10, 40);
    this.ctx.lineTo(-10, 10);
    this.ctx.lineTo(-25, 10);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();

    // Label testuale sotto la freccia
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(cx - 120, cy + 50, 240, 36);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, cx, cy + 74);
  }

  drawHighlight(bbox, label, color) {
    // Scala le coordinate bbox alle dimensioni del canvas
    const scaleX = this.canvas.width / this.videoWidth;
    const scaleY = this.canvas.height / this.videoHeight;

    const x = bbox.x1 * scaleX;
    const y = bbox.y1 * scaleY;
    const w = (bbox.x2 - bbox.x1) * scaleX;
    const h = (bbox.y2 - bbox.y1) * scaleY;

    // Rettangolo colorato attorno all'oggetto
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, w, h);

    // Label sopra il rettangolo
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y - 24, this.ctx.measureText(label).width + 12, 24);
    this.ctx.fillStyle = '#000';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText(label, x + 6, y - 6);
  }

  drawNotification(text, color) {
    const cx = this.canvas.width / 2;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(cx - 160, 20, 320, 40);
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, cx, 46);
  }
}
```

### 2.2.3 Collegamento con i dati di YOLO

Il loop principale dell'AR integra le detection e lo stato di navigazione:

```javascript
// Main AR loop
class ARNavigationLoop {
  constructor(videoElement, overlayCanvas, apiBaseUrl) {
    this.video = videoElement;
    this.overlay = new AROverlayManager(
      overlayCanvas, videoElement.videoWidth, videoElement.videoHeight
    );
    this.apiBaseUrl = apiBaseUrl;
    this.navigationState = null;
    this.isRunning = false;
    this.detectionInterval = 1000; // 1 frame al secondo per MVP (server-side)
  }

  async start(sessionId) {
    this.isRunning = true;
    this.sessionId = sessionId;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  async loop() {
    if (!this.isRunning) return;

    try {
      // 1. Cattura frame e invia al server YOLO
      const frameBlob = await this.captureFrame();
      const detections = await this.sendForDetection(frameBlob);

      // 2. Aggiorna la posizione sul backend
      const navUpdate = await this.updateNavigation(detections);

      // 3. Prepara lo stato per il rendering
      const navState = {
        nextStep: navUpdate.next_step,
        detections: detections,
        positionConfirmed: navUpdate.position_confirmed,
        arrived: navUpdate.arrived
      };

      // 4. Renderizza overlay
      this.overlay.render(navState);

      // 5. Se arrivato, mostra notifica finale
      if (navState.arrived) {
        this.overlay.drawNotification('Sei arrivato a destinazione!', '#FFD700');
        this.stop();
        return;
      }
    } catch (err) {
      console.warn('AR loop error, retrying:', err);
    }

    // Prossima iterazione
    setTimeout(() => this.loop(), this.detectionInterval);
  }

  async captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, 640, 480);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.65));
  }

  async sendForDetection(blob) {
    const formData = new FormData();
    formData.append('image', blob);
    formData.append('session_id', this.sessionId);

    const res = await fetch(`${this.apiBaseUrl}/api/detect`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.detections;
  }

  async updateNavigation(detections) {
    const res = await fetch(`${this.apiBaseUrl}/api/navigation/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: this.sessionId,
        detections: detections,
        heading: currentHeading  // dalla bussola
      })
    });
    return res.json();
  }
}
```

### 2.2.4 Modalità fallback testuale

Quando l'utente non vuole o non può usare la camera (permesso negato, batteria bassa, preferenza), il sistema offre una modalità testuale:

**Struttura tecnica**:
- L'app chiede al backend l'intero percorso come lista di step testuali.
- Ciascuno step contiene: istruzione, distanza approssimativa, punto di riferimento.
- L'utente avanza manualmente ("Step successivo") o il sistema avanza automaticamente quando rileva un QR (se la camera è attiva in background per i soli QR).

**Endpoint**:

```
GET /api/navigation/text_route?session_id=abc-123

Response:
{
  "steps": [
    {
      "index": 1,
      "instruction": "Avanza dritto nel corridoio per circa 30 metri.",
      "reference": "Passerai davanti all'Aula 1.05 sulla sinistra.",
      "reference_image_url": "/static/refs/corridor_floor1_north.jpg"  // opzionale
    },
    {
      "index": 2,
      "instruction": "Al bivio, gira a destra.",
      "reference": "Vedrai un cartello con la freccia verso le Aule 2.xx.",
      "reference_image_url": "/static/refs/junction_sign_2xx.jpg"
    },
    {
      "index": 3,
      "instruction": "Sali le scale al piano 2 (oppure usa l'ascensore 10 metri più avanti).",
      "reference": "Le scale sono accanto al distributore automatico.",
      "reference_image_url": null
    },
    {
      "index": 4,
      "instruction": "Al piano 2, gira a sinistra. L'Aula 2.14 è la terza porta sulla destra.",
      "reference": "Vedrai la targa 'Aula 2.14' sulla porta.",
      "reference_image_url": null
    }
  ],
  "total_steps": 4,
  "estimated_walking_minutes": 3
}
```

---

## 2.3 Modulo di Generative AI

### 2.3.1 Ruolo del modello linguistico

L'assistente conversazionale è un LLM (es. Claude via API Anthropic, o GPT via OpenAI) che opera come **guida del campus grounded su dati strutturati**. Non è un chatbot generico: ogni risposta è ancorata a:

1. **Grafo del campus**: conosce la topologia degli edifici, corridoi, piani, stanze.
2. **Posizione corrente stimata**: sa dove si trova l'utente in questo momento.
3. **Percorso calcolato**: conosce gli step rimanenti verso la destinazione.
4. **Detection YOLO recenti**: sa cosa la camera ha "visto" negli ultimi secondi.
5. **Profilo di accessibilità**: sa se l'utente ha vincoli di mobilità.

**Casi d'uso specifici**:

| Caso | Input dell'utente | Comportamento atteso |
|------|-------------------|----------------------|
| Spiegazione percorso | "Come arrivo all'Aula 3.07?" | Descrive i prossimi step in linguaggio naturale, semplice e numerato |
| Riformulazione | "Puoi ripetere più lentamente?" | Riformula con frasi più corte, un passo alla volta |
| Traduzione | "Can you explain in English?" | Switcha lingua di risposta, mantiene contesto |
| Utente perso | "Mi sono perso, non so dove sono" | Chiede cosa vede, incrocia con detection YOLO, propone re-localizzazione |
| Accessibilità | "Ci sono ascensori?" | Risponde in base al grafo; se serve, propone percorso alternativo |
| Info campus | "Dov'è il bar più vicino?" | Risponde se l'info è nel grafo, altrimenti dice che non lo sa |

### 2.3.2 Schema dei prompt e del contesto

#### System prompt

```
Sei l'assistente di navigazione Path2Class per il campus universitario [Nome Campus].

Il tuo ruolo:
- Guidare l'utente verso la sua destinazione all'interno del campus.
- Spiegare il percorso in modo semplice, con frasi brevi e numerate.
- Rispondere a domande sulla navigazione, l'accessibilità e i servizi del campus.
- Adattare la lingua delle risposte in base alla preferenza dell'utente.

Regole:
1. Basa SEMPRE le tue risposte sui dati di contesto forniti (posizione, percorso, detection). Non inventare informazioni.
2. Se non hai abbastanza informazioni per rispondere, dillo chiaramente e suggerisci un'azione (es. "Prova a inquadrare un cartello vicino a te").
3. Rispondi in modo conciso: massimo 3-4 frasi per risposta, a meno che l'utente chieda più dettaglio.
4. Quando descrivi indicazioni, usa riferimenti visivi concreti ("dopo il distributore automatico", "la porta con la targa blu").
5. Se l'utente ha vincoli di accessibilità, proponi SOLO percorsi accessibili.
6. Non dare informazioni su orari, docenti o contenuti dei corsi a meno che non siano nel contesto.
7. Usa un tono cordiale ma diretto. Non usare emoji.
```

#### Formato del messaggio utente (strutturato)

Ad ogni richiesta dell'utente, il backend costruisce un messaggio combinando contesto strutturato e input utente:

```json
{
  "context": {
    "current_position": {
      "node_id": "building_A_floor_1_corridor_east",
      "label": "Corridoio est, Piano 1, Edificio A",
      "confidence": 0.85
    },
    "destination": {
      "node_id": "building_A_floor_2_room_214",
      "label": "Aula 2.14"
    },
    "remaining_steps": [
      {"action": "go_straight", "label": "Prosegui dritto per 20 metri fino alle scale"},
      {"action": "climb_stairs", "label": "Sali al piano 2"},
      {"action": "turn_left", "label": "Gira a sinistra, l'Aula 2.14 è la seconda porta"}
    ],
    "recent_detections": [
      {"class": "direction_arrow", "direction": "straight", "confidence": 0.88},
      {"class": "sign_room_number", "label": "1.18", "confidence": 0.91}
    ],
    "accessibility": {"avoid_stairs": false},
    "user_language": "it"
  },
  "user_message": "Quanto manca per arrivare?"
}
```

Il backend formatta questo JSON come testo nel messaggio utente per il LLM:

```
[CONTESTO NAVIGAZIONE]
Posizione attuale: Corridoio est, Piano 1, Edificio A (confidenza: 85%)
Destinazione: Aula 2.14
Step rimanenti:
  1. Prosegui dritto per 20 metri fino alle scale
  2. Sali al piano 2
  3. Gira a sinistra, l'Aula 2.14 è la seconda porta
Detection recenti: freccia direzionale (dritto), targa stanza 1.18
Accessibilità: nessun vincolo
Lingua: italiano

[DOMANDA UTENTE]
Quanto manca per arrivare?
```

### 2.3.3 API e integrazione

**Endpoint**:

```
POST /api/assistant/route_help

Request:
{
  "session_id": "abc-123",
  "user_language": "it",
  "user_message": "Quanto manca per arrivare?",
  "context": { ... }   // opzionale: se omesso, il backend lo ricostruisce dalla sessione
}

Response:
{
  "reply": "Ti mancano 3 passaggi. Prosegui dritto fino alle scale, sali al piano 2, poi gira a sinistra: l'Aula 2.14 è la seconda porta.",
  "suggested_actions": [
    {"label": "Mostra percorso alternativo con ascensore", "action_id": "alt_route_elevator"}
  ],
  "language_used": "it",
  "escalation": null
}
```

**Pseudo-codice backend**:

```python
from fastapi import FastAPI
from anthropic import Anthropic  # o openai, a seconda del provider

app = FastAPI()
llm_client = Anthropic()

SYSTEM_PROMPT = """Sei l'assistente di navigazione Path2Class per il campus universitario.
Il tuo ruolo: guidare l'utente verso la sua destinazione...
[system prompt completo come definito sopra]
"""

@app.post("/api/assistant/route_help")
async def route_help(request: RouteHelpRequest):
    # 1. Recupera stato sessione
    session = get_session(request.session_id)

    # 2. Costruisci contesto se non fornito
    context = request.context or build_context_from_session(session)

    # 3. Formatta il messaggio per il LLM
    context_text = format_navigation_context(context)
    user_text = f"{context_text}\n\n[DOMANDA UTENTE]\n{request.user_message}"

    # 4. Chiamata al LLM
    response = llm_client.messages.create(
        model="claude-sonnet-4-6-20250415",
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_text}
        ]
    )

    reply_text = response.content[0].text

    # 5. Suggerisci azioni contestuali
    suggested = generate_suggested_actions(context, reply_text)

    return {
        "reply": reply_text,
        "suggested_actions": suggested,
        "language_used": request.user_language,
        "escalation": None
    }
```

### 2.3.4 Esempi concreti di prompt

#### Esempio 1 — Spiega il percorso dall'ingresso A all'aula B

**System**: (system prompt standard)

**User**:
```
[CONTESTO NAVIGAZIONE]
Posizione attuale: Ingresso principale, Piano 0, Edificio A (confidenza: 99%)
Destinazione: Aula 2.14, Piano 2, Edificio A
Step rimanenti:
  1. Attraversa l'atrio dritto fino al corridoio nord
  2. Al fondo del corridoio, prendi le scale sulla destra
  3. Sali al piano 2
  4. Al piano 2, gira a sinistra nel corridoio
  5. L'Aula 2.14 è la terza porta sulla destra
Detection recenti: entrance_door (confidenza 0.95)
Accessibilità: nessun vincolo
Lingua: italiano

[DOMANDA UTENTE]
Come arrivo all'Aula 2.14?
```

**Risposta attesa del LLM**:
```
Per raggiungere l'Aula 2.14, segui questi passaggi:

1. Attraversa l'atrio dritto davanti a te fino al corridoio nord.
2. In fondo al corridoio, troverai le scale sulla destra — sali al piano 2.
3. Al piano 2, gira a sinistra nel corridoio: l'Aula 2.14 è la terza porta sulla destra.

Sono circa 3-4 minuti a piedi.
```

#### Esempio 2 — Utente perso che descrive ciò che vede

**System**: (system prompt standard)

**User**:
```
[CONTESTO NAVIGAZIONE]
Posizione attuale: Sconosciuta (confidenza: 30% — ultima posizione nota: corridoio sud, Piano 1, Edificio A)
Destinazione: Laboratorio 3.02, Piano 3, Edificio A
Step rimanenti: impossibile calcolare (posizione incerta)
Detection recenti: sign_room_number "1.22" (confidenza 0.89), campus_landmark "distributore" (confidenza 0.78)
Accessibilità: nessun vincolo
Lingua: italiano

[DOMANDA UTENTE]
Mi sono perso. Vedo la targa dell'aula 1.22 e un distributore automatico.
```

**Risposta attesa del LLM**:
```
Ti ho localizzato: sei nel corridoio del Piano 1, vicino all'Aula 1.22 — è la zona sud-est dell'Edificio A.

Per raggiungere il Laboratorio 3.02 da dove sei:
1. Vai verso destra lungo il corridoio (lasciandoti il distributore alle spalle).
2. Troverai le scale in fondo al corridoio — sali fino al piano 3.
3. Al piano 3, il Laboratorio 3.02 sarà indicato sulla sinistra.

Il percorso è stato ricalcolato dalla tua posizione attuale.
```

#### Esempio 3 — Richiesta di istruzioni semplificate

**System**: (system prompt standard)

**User**:
```
[CONTESTO NAVIGAZIONE]
Posizione attuale: Corridoio nord, Piano 2, Edificio A (confidenza: 82%)
Destinazione: Aula 2.14, Piano 2, Edificio A
Step rimanenti:
  1. Prosegui dritto per 15 metri
  2. Gira a sinistra al bivio
  3. L'Aula 2.14 è la seconda porta sulla destra
Detection recenti: direction_arrow "straight" (confidenza 0.90)
Accessibilità: nessun vincolo
Lingua: pt

[DOMANDA UTENTE]
Pode repetir mais devagar? Não entendi bem.
```

**Risposta attesa del LLM**:
```
Claro! Vou explicar passo a passo:

Passo 1: Continue andando reto no corredor onde você está agora. Caminhe uns 15 metros.

Passo 2: Você vai encontrar uma bifurcação. Vire à esquerda.

Passo 3: Depois de virar, a Sala 2.14 é a segunda porta do lado direito.

Você está muito perto — são menos de 2 minutos!
```

---

## 2.4 Architettura complessiva e integrazione

### 2.4.1 Architettura logica

Il sistema è composto da cinque componenti principali:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         UTENTE (Smartphone)                         │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ QR Scanner  │  │ Camera Feed  │  │ AR Overlay │  │ Chat UI    │ │
│  │ (ingresso)  │  │ (video)      │  │ (canvas)   │  │ (testo)    │ │
│  └──────┬──────┘  └──────┬───────┘  └─────▲──────┘  └─────┬──────┘ │
│         │                │                 │               │         │
│  ┌──────▼────────────────▼─────────────────┴───────────────▼──────┐ │
│  │                   PWA Front-End (JavaScript)                    │ │
│  │  - Service Worker (offline cache)                               │ │
│  │  - Navigation Controller (stato sessione locale)                │ │
│  │  - Frame Capture + invio al backend                             │ │
│  │  - Rendering overlay AR                                         │ │
│  │  - Interfaccia chat                                             │ │
│  └───────────────────────────┬────────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS / REST API
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Server)                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                  API Gateway / Router (FastAPI)                 │  │
│  │  - /api/session/start      → crea sessione da QR              │  │
│  │  - /api/navigation/route   → calcola percorso                 │  │
│  │  - /api/navigation/update  → aggiorna posizione + ricalcola   │  │
│  │  - /api/detect             → inference YOLO                   │  │
│  │  - /api/assistant/route_help → assistente GenAI               │  │
│  │  - /api/navigation/text_route → percorso testuale             │  │
│  └──────┬───────────┬──────────────┬──────────────┬──────────────┘  │
│         │           │              │              │                   │
│         ▼           ▼              ▼              ▼                   │
│  ┌───────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐          │
│  │ Routing   │ │ YOLO    │ │ GenAI     │ │ Session      │          │
│  │ Engine    │ │ Service │ │ Service   │ │ Manager      │          │
│  │           │ │         │ │           │ │              │          │
│  │ - Grafo   │ │ - Model │ │ - LLM API│ │ - Stato user │          │
│  │ - Dijkstra│ │ - GPU   │ │ - Prompt  │ │ - Posizione  │          │
│  │ - A*      │ │ - Infer │ │ - Context │ │ - Route      │          │
│  └─────┬─────┘ └────┬────┘ └─────┬─────┘ └──────┬───────┘          │
│        │            │            │               │                   │
│        └────────────┴────────────┴───────────────┘                   │
│                              │                                       │
│                              ▼                                       │
│                    ┌───────────────────┐                             │
│                    │     Database      │                             │
│                    │  - Campus graph   │                             │
│                    │  - QR mappings    │                             │
│                    │  - Sessions       │                             │
│                    │  - Accessibility  │                             │
│                    └───────────────────┘                             │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.4.2 Flusso end-to-end dettagliato

#### Passo 1 — Scansione QR

1. L'utente punta la camera su un QR code Path2Class all'ingresso.
2. Il browser decodifica il QR (libreria `jsQR` o API nativa `BarcodeDetector`).
3. Il QR contiene un URL: `https://path2class.example.com/start?node=building_A_floor_0_entrance_main`.
4. La PWA si apre (o, se già aperta, legge il parametro) e chiama:
   ```
   POST /api/session/start
   { "start_node": "building_A_floor_0_entrance_main" }
   → { "session_id": "abc-123", "location_label": "Ingresso principale, Edificio A" }
   ```

#### Passo 2 — Selezione destinazione

5. L'app mostra una lista di destinazioni (caricata da `/api/campus/destinations`).
6. L'utente cerca e seleziona "Aula 2.14".
7. L'app chiama:
   ```
   POST /api/navigation/route
   { "session_id": "abc-123", "destination_node": "building_A_floor_2_room_214", "avoid_stairs": false }
   → { "route": [...steps...], "estimated_minutes": 4 }
   ```

#### Passo 3 — Avvio navigazione AR

8. L'utente sceglie "Naviga con AR" → l'app chiede permesso camera.
9. Camera attiva, overlay canvas sovrapposto.
10. Parte il loop AR: cattura frame → invio `/api/detect` → detection → rendering overlay.

#### Passo 4 — Detection ricorrenti e aggiornamento posizione

11. Ogni ~1 secondo, un frame viene inviato al server YOLO.
12. Le detection vengono inviate a `/api/navigation/update`:
    ```
    POST /api/navigation/update
    { "session_id": "abc-123", "detections": [...], "heading": 45.2 }
    → { "position": {...}, "next_step": {...}, "position_confirmed": true, "arrived": false, "route_recalculated": false }
    ```
13. Se la posizione è cambiata in modo inatteso → ricalcolo percorso automatico.
14. L'AR overlay si aggiorna con nuove frecce/indicatori.

#### Passo 5 — Assistenza conversazionale

15. In qualsiasi momento, l'utente apre la chat e scrive (o parla, con Web Speech API).
16. L'app invia:
    ```
    POST /api/assistant/route_help
    { "session_id": "abc-123", "user_message": "Mi sono perso", "user_language": "it" }
    → { "reply": "...", "suggested_actions": [...] }
    ```
17. La risposta viene mostrata nella chat (e opzionalmente letta ad alta voce con Speech Synthesis API).

#### Passo 6 — Arrivo

18. Quando `/api/navigation/update` restituisce `"arrived": true`, l'AR mostra "Sei arrivato!".
19. La sessione rimane attiva per qualche minuto (l'utente può chiedere info aggiuntive), poi si chiude.

### 2.4.3 Roadmap di implementazione

#### MVP 1 — Routing base + PWA testuale (settimane 1–3)

**Obiettivo**: navigazione funzionante senza AR né YOLO, solo testo.

- Modellazione del grafo del campus (nodi + archi) in formato JSON o database SQLite.
- Backend FastAPI con:
  - `/api/session/start`
  - `/api/navigation/route` (Dijkstra/A* sul grafo)
  - `/api/navigation/text_route`
  - `/api/campus/destinations`
- PWA minimale:
  - Scansione QR → apertura PWA con posizione iniziale.
  - Lista destinazioni → selezione → percorso testuale step-by-step.
  - Service worker per caching base.
- **Risultato**: l'utente può navigare seguendo istruzioni testuali.

#### MVP 2 — Integrazione YOLO + overlay AR semplice (settimane 4–7)

**Obiettivo**: aggiungere il riconoscimento visivo e l'AR overlay.

- Raccolta e annotazione dataset campus.
- Training YOLOv8n, valutazione, export.
- Backend: endpoint `/api/detect`.
- Backend: endpoint `/api/navigation/update` con logica di fusione detection-posizione.
- PWA: accesso camera, loop di cattura frame, invio al server.
- PWA: AR overlay canvas con frecce direzionali e highlight sulle detection.
- **Risultato**: l'utente vede frecce AR sovrapposte alla camera e la posizione si aggiorna in base a ciò che la camera vede.

#### MVP 3 — Modulo Generative AI (settimane 8–10)

**Obiettivo**: aggiungere l'assistente conversazionale.

- Design del system prompt e del formato di contesto.
- Backend: endpoint `/api/assistant/route_help` con integrazione API LLM.
- PWA: interfaccia chat (input testo, visualizzazione risposte).
- Gestione lingua: rilevamento lingua utente, risposte nella lingua corretta.
- Test con scenari: percorso standard, utente perso, richiesta accessibilità, cambio lingua.
- **Risultato**: l'utente può chattare con l'assistente durante la navigazione.

#### Ottimizzazioni successive (settimane 11+)

- **Performance YOLO**: valutazione deploy client-side (ONNX + WebGPU), caching delle detection, riduzione frame rate adattivo.
- **AR avanzata**: test WebXR dove supportato, ancoraggi 3D più precisi.
- **Voce**: integrazione Web Speech API (speech-to-text per input, text-to-speech per output).
- **Accessibilità**: test con utenti reali, percorsi accessibili verificati, feedback tattile/sonoro.
- **Offline**: caching aggressivo del grafo e delle ultime detection, modello YOLO in cache via service worker.
- **OCR**: modulo di lettura testo dalle targhe (regione ritagliata dal bbox `sign_room_number`), per localizzazione ancora più precisa.
- **Multi-edificio e outdoor**: estensione del grafo a percorsi esterni tra edifici, integrazione GPS per tratti all'aperto.

---

## Appendice — Stack tecnologico riepilogativo

| Componente | Tecnologia |
|------------|------------|
| Front-end PWA | HTML5, CSS, JavaScript (vanilla o framework leggero), Service Worker |
| Camera e Video | `navigator.mediaDevices.getUserMedia()` |
| AR overlay | Canvas 2D / Three.js su video stream |
| QR scanning | `BarcodeDetector` API o `jsQR` |
| Orientamento | `DeviceOrientationEvent` (bussola, giroscopio) |
| Backend API | Python, FastAPI |
| Routing | Dijkstra / A* su grafo campus (NetworkX o implementazione custom) |
| Database | SQLite (MVP) → PostgreSQL (produzione) |
| YOLO training | Ultralytics YOLOv8, Python, PyTorch |
| YOLO inference server | FastAPI + Ultralytics, GPU (NVIDIA) |
| YOLO inference client | ONNX Runtime Web (WebGPU / WASM) |
| Generative AI | API Claude (Anthropic) o API OpenAI |
| Speech (opzionale) | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Deploy server | Docker, cloud provider con GPU (per YOLO) |
| Deploy PWA | Hosting statico (Netlify, Vercel, GitHub Pages) + backend separato |
