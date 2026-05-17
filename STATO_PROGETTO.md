# Path2Class — Stato del progetto

## Cos'è Path2Class

Path2Class è una **web app universitaria di navigazione indoor** che aiuta studenti e visitatori a trovare aule, uffici e servizi all'interno del campus. L'idea di partenza è semplice: gli edifici universitari sono labirintici, le mappe stampate sono inutili a chi non sa già dove si trova, e Google Maps non funziona dentro un palazzo. Path2Class risolve il problema mettendo dei **QR code fisici** nei punti chiave dell'edificio (ascensori, ingressi, snodi): l'utente li inquadra col telefono, l'app capisce immediatamente dove si trova, gli chiede dove vuole andare e lo accompagna passo passo.

L'esperienza ha tre componenti che lavorano insieme. La **realtà aumentata** sovrappone una freccia cyan al video della fotocamera, così l'utente vede dove andare guardando direttamente il corridoio davanti a sé. L'**intelligenza artificiale visiva (YOLO)** riconosce in tempo reale porte, segnali, ascensori, cestini, quadri, bocchette e cartelli, confermando che l'utente è sulla strada giusta. Un **assistente conversazionale (Llama 3.3 su Groq)** risponde a domande in linguaggio naturale ("Dove sono?", "Mi sono perso", "Cosa puoi fare?") in italiano, inglese o portoghese, ed è arricchito con una RAG che gli permette di guidare l'utente passo per passo, recuperarlo se sbaglia strada, rispondere a FAQ tecniche e parlare del progetto.

L'app è online su **[path2class.vercel.app](https://path2class.vercel.app)**.

---

## Come scaricare e avviare il progetto da GitHub

Questa guida è per chi non ha mai usato il terminale. Segui i passaggi nell'ordine.

### Cosa ti serve installare prima (una volta sola)

1. **Git** — il programma che scarica il codice da GitHub
   - Vai su https://git-scm.com/downloads
   - Scarica la versione per il tuo sistema (Windows / Mac / Linux), installala con le opzioni di default

2. **Node.js** — il motore che fa girare la web app
   - Vai su https://nodejs.org
   - Scarica la versione **LTS** (quella consigliata, non la "Current")
   - Installala con le opzioni di default

3. **Visual Studio Code** (consigliato, non obbligatorio) — l'editor con un terminale integrato comodo
   - https://code.visualstudio.com

Per verificare che tutto sia installato, apri il terminale (su Windows: tasto Windows → digita "PowerShell" → invio) e digita:
```
git --version
node --version
npm --version
```
Se ognuno ti restituisce un numero di versione, sei pronto.

### Scaricare il progetto

Apri il terminale nella cartella dove vuoi mettere il progetto (es. `Documenti`), poi:

```sh
git clone https://github.com/DC-09/path2class.git
cd path2class
```

Adesso il progetto è scaricato e sei dentro la sua cartella.

### Avviare la web app

```sh
cd web
npm install
```

Il comando `npm install` scarica tutte le librerie necessarie (la prima volta ci mette 1-2 minuti). Se vedi qualche `warning` ignoralo, è normale. Se vedi errori `error`, fermati e chiedi.

Quando ha finito, avvia il server di sviluppo:

```sh
npm run dev
```

Vedrai una scritta tipo:
```
  VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Apri il browser e vai su quell'indirizzo. La web app è viva.

Per fermarla: torna nel terminale e premi `Ctrl + C`.

### Provarla sul telefono (3 modi)

**Opzione A — Usa direttamente la versione online**: apri [path2class.vercel.app](https://path2class.vercel.app) sul telefono. È il modo più semplice. La fotocamera funziona perché Vercel serve l'app via HTTPS.

**Opzione B — Scansiona il QR fisico**: stampa il file `docs/qr-elevator.svg` (dalla cartella del progetto) e attaccalo davanti all'ascensore. Inquadralo col telefono e ti porta direttamente sull'app.

**Opzione C — Test locale via ngrok**: se vuoi testare modifiche fatte sul tuo computer:
1. Vai su https://ngrok.com, crea un account gratuito, scarica ngrok, autenticati con il comando che ti dà
2. Lascia il `npm run dev` attivo
3. In un secondo terminale: `ngrok http 5173`
4. Ngrok ti dà un URL del tipo `https://qualcosa.ngrok-free.app`. Aprilo sul telefono nello stesso browser. Quando l'app chiede la fotocamera, accettala.

### Aggiornare il progetto in futuro

Quando qualcuno (tu o un collega) carica nuove modifiche su GitHub, scaricale così:

```sh
cd path2class
git pull
cd web
npm install         # solo se sono cambiate le librerie
npm run dev
```

Vercel rideploya automaticamente ogni `git push` su `main`, quindi anche la versione online si aggiorna da sola entro 1-2 minuti.

---

## Cosa è stato costruito finora

L'**interfaccia utente è completa e online**. Tutte le schermate funzionano: schermata di benvenuto (Splash, ridisegnata su handoff dedicato con logo che galleggia + 3 step card + CTA "Get started"), Landing con ricerca destinazione, conferma destinazione con illustrazione della porta, richiesta permesso fotocamera, navigazione AR live con freccia liquid glass cyan, navigazione testuale con planimetria a L, schermata di arrivo. Tutta la grafica è in stile **Liquid Glass** — superfici traslucide, sfondo caldo color sabbia, accenti azzurri.

L'app è **multilingua** (italiano, inglese, portoghese) con auto-rilevamento al primo avvio. Ricorda le ultime destinazioni cercate. Ha un toggle "percorso accessibile" che ad oggi mostra lo stesso percorso (partiamo già dall'ascensore, non ci sono varianti). È **accessibile da tastiera**, ha etichette per screen reader, e rispetta le preferenze di animazioni ridotte.

L'**assistente AI è attivo e funzionante in produzione**. Si apre come un foglio dal basso in qualsiasi schermata, riceve risposte in streaming token per token da **Llama 3.3 70B su Groq** (tramite una Supabase Edge Function). Il system prompt è una vera **RAG**: descrive il percorso completo dall'ascensore all'Aula 124 con tutti i landmark (quadro, segnale antincendio, segnale del bagno, segnale grande, doppia porta finale), gestisce il recupero quando l'utente sbaglia strada, sa rispondere a domande tecniche (permessi fotocamera, lingua, problemi comuni), conosce le proprie capacità, e parla del progetto in modo semplice senza scendere in tecnicismi.

Esiste anche un **backend Python** (FastAPI) con un servizio YOLO, un servizio LLM e un grafo del campus completo (più edifici, piani, stanze). Era pensato come servizio centrale prima che si decidesse di usare Supabase per l'assistente. **Non è collegato alla web app attiva** — resta come riferimento per quando si estenderà la mappa.

## Cosa funziona oggi

- L'intera interfaccia visiva su mobile e desktop, deployata su Vercel
- Schermata Splash ridisegnata (logo che galleggia + 3 step card)
- Favicon con logo Path2Class su tile beige
- Scansione del QR fisico → apertura diretta dell'app sulla Landing
- La fotocamera live in modalità AR (con HTTPS via Vercel o ngrok per il dev)
- **Freccia AR in stile Liquid Glass** con gradient cyan, alone diffuso, riflesso e ombra al suolo — ruota di ±35° per indicare svolte a destra/sinistra
- Il riconoscimento oggetti **reale** con il modello YOLOv8n allenato sul corridoio target (CPU backend TF.js, ~3 FPS, NMS post-processing) — 7 classi: `path2class`, `bin`, `door`, `elevator`, `painting`, `signal`, `vent`
- **Avanzamento automatico degli step** in modalità AR: la freccia ruota e il pallino sulla planimetria avanza quando YOLO riconosce il landmark corretto per N frame consecutivi
- **Alert "Direzione sbagliata"** in 2 scenari: (1) all'ascensore, se YOLO vede il cestino l'utente sta guardando dalla parte sbagliata; (2) al segnale grande, se l'utente non gira a destra entro 10 secondi probabilmente è andato dritto verso il muro
- Modalità testuale **semplificata in 4 step**, con planimetria a L che riproduce la geometria reale (corridoio principale + braccio perpendicolare con Aula 124 in fondo)
- L'assistente AI online: streaming token per token, contesto sempre aggiornato (sa dove sei nello step, dove stai andando, cosa la camera ha visto di recente), RAG ricca con percorso completo, capabilities, recovery, FAQ tecniche, info sul progetto
- Scelta lingua, percorso accessibile, destinazioni recenti salvate localmente

## Cosa NON funziona ancora

- **Il backend Python non è collegato alla web app**: il vecchio frontend HTML lo usava, il nuovo no. Per ora è "isolato" — utile come riferimento per quando si estenderà la mappa oltre il singolo corridoio.
- **Mappa limitata**: il sistema gestisce per ora solo un corridoio (1° piano, dall'ascensore all'Aula 124) — l'MVP della demo. Il backend ha un grafo più ampio ma non è collegato alla nuova UI.
- **Step di navigazione e dialoghi dell'assistente guidato dipendono dai landmark reali**: i 4 step della modalità testuale e il dialogo guidato dell'assistente sono coerenti col percorso descritto a parole, ma vanno verificati camminando fisicamente nel corridoio e affinati se qualcosa non corrisponde.

## Prossimi passi (in ordine di priorità)

1. **Stampare il QR fisico**: il file è già pronto in `docs/qr-elevator.svg` (logo Path2Class al centro, codice scansionabile). Apri il file nel browser, Ctrl+P, stampa A4, plastifica e attacca davanti all'ascensore del 1° piano.
2. **Testare YOLO nel corridoio reale**: il modello è integrato e funzionante online — verificare le detection sul campo (1° piano, dall'ascensore all'Aula 124). Se accuratezza insufficiente, raccogliere più foto del corridoio e ri-allenare con `python yolo/scripts/train.py`.
3. **Test su utenti reali**: far provare l'app a 3-5 persone che non conoscono il corridoio. Notare dove si bloccano, cosa fraintendono, se l'assistente AI risponde bene.
4. **Estendere la mappa oltre il singolo corridoio**: collegare il grafo completo del backend (più edifici e piani) alla nuova interfaccia. Questo è un lavoro più grosso e dipende da quanto si vuole spingere la tesi.

## Problemi noti

- **I nomi delle destinazioni recenti non si traducono dopo il salvataggio**: se salvi "Aula 124" in italiano e poi cambi lingua, resta in italiano. Soluzione facile per il futuro — salvare l'ID e tradurre al momento.
- **iOS richiede un gesto utente per il sensore di orientamento**: oggi non lo usiamo (la freccia AR è guidata dallo store dell'app), ma se in futuro vogliamo orientare la freccia con la bussola va aggiunto un permesso esplicito.
- **Bundle JavaScript da ~1.4 MB** (gzip ~370 KB) — pesa parecchio per via di TensorFlow. Si potrebbe lazy-load YOLO solo quando si entra in AR, ma per la demo va bene così.
