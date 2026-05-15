# Path2Class — Stato del progetto

## Cos'è Path2Class

Path2Class è una **web app universitaria di navigazione indoor** che aiuta studenti e visitatori a trovare aule, uffici e servizi all'interno del campus. L'idea di partenza è semplice: gli edifici universitari sono labirintici, le mappe stampate sono inutili a chi non sa già dove si trova, e Google Maps non funziona dentro un palazzo. Path2Class risolve il problema mettendo dei **QR code fisici** nei punti chiave dell'edificio (ingressi, snodi, ascensori): l'utente li inquadra col telefono, l'app capisce immediatamente dove si trova, gli chiede dove vuole andare e lo accompagna passo passo.

L'esperienza ha tre componenti che lavorano insieme. La **realtà aumentata** sovrappone frecce e indicazioni al video della fotocamera, così l'utente vede dove andare guardando direttamente il corridoio davanti a sé. L'**intelligenza artificiale visiva (YOLO)** riconosce in tempo reale targhe delle aule, segnaletica, porte, ascensori e scale, confermando che l'utente è sulla strada giusta. Un **assistente conversazionale (Llama 3.3 su Groq)** risponde a domande in linguaggio naturale ("Dove sono?", "C'è un ascensore?", "Sono dislessico, puoi spiegarmelo più semplicemente?") in italiano, inglese o portoghese. Tutto è pensato anche per persone con disabilità motorie: c'è una modalità "percorso accessibile" che evita le scale.

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

### Provarla sul telefono (richiede HTTPS per la fotocamera)

La fotocamera funziona solo su HTTPS, e `localhost` su un PC non basta per il telefono. Si usa **ngrok** (un tunnel pubblico):

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

---

## Cosa è stato costruito finora

L'**interfaccia utente è completa**. Tutte le schermate previste dal disegno funzionano: schermata iniziale di benvenuto, riconoscimento QR simulato, ricerca della destinazione, conferma con foto della porta, richiesta del permesso fotocamera, navigazione AR live con frecce e riconoscimenti, navigazione testuale con piantina, schermata di arrivo con confetti. Tutta la grafica è ispirata allo stile "Liquid Glass" — superfici traslucide, sfondo caldo color sabbia, accenti azzurri — e segue il prototipo originale al pixel.

L'app è **multilingua** (italiano, inglese, portoghese) e ricorda le ultime destinazioni cercate. Ha un'opzione "percorso accessibile" che cambia automaticamente le indicazioni preferendo l'ascensore. È **accessibile da tastiera**, ha etichette per screen reader, e rispetta le preferenze di animazioni ridotte.

L'**assistente AI è funzionante** — il codice è già scritto e collegato. Si apre come un foglio dal basso in qualsiasi schermata, riceve risposte in streaming token per token, e capisce il contesto (sa dove sei, dove stai andando, se hai bisogno di un percorso accessibile). Manca solo la chiave API da configurare per attivarlo.

C'è anche un **backend Python** (FastAPI) con un servizio YOLO, un servizio LLM, un grafo del campus completo (più edifici, piani, stanze) e tutte le rotte HTTP per gestire sessioni, percorsi e detection. Era pensato come servizio centrale prima che si decidesse di usare Supabase per l'assistente.

Esiste anche un **prototipo iOS in SwiftUI** — è una bozza grafica della stessa idea fatta in Swift nativo, separata dal resto.

## Cosa funziona oggi

- L'intera interfaccia visiva su mobile e desktop
- La navigazione tra schermate
- La fotocamera live in modalità AR (con tunneling HTTPS via ngrok o Vercel)
- Il riconoscimento oggetti **reale** con il modello YOLOv8n allenato sul corridoio target (CPU backend TF.js, ~3 FPS, NMS post-processing) — 7 classi: `path2class`, `bin`, `door`, `elevator`, `painting`, `signal`, `vent`
- La navigazione testuale con step list e mini-piantina
- Scelta lingua, percorso accessibile, destinazioni recenti salvate localmente
- Tutto il codice dell'assistente AI fino al punto di chiamata della funzione Supabase

## Cosa NON funziona ancora

- **L'assistente AI in produzione**: il codice c'è ma serve la chiave API Groq e il deploy della funzione su Supabase. Senza, l'utente vede un messaggio "non configurato".
- **Il backend Python non è collegato alla web app**: il vecchio frontend HTML lo usava, il nuovo no. Per ora è "isolato" — utile come riferimento ma non parte del flusso.
- **Niente QR code fisici reali**: l'app simula la scansione tramite un pulsante. La generazione e stampa dei QR è un passo successivo.
- **Mappa limitata**: il sistema gestisce per ora solo un corridoio (Edificio B, 2° piano, ala ovest, Aula 21 W) — l'MVP della demo. Il backend ha un grafo più ampio ma non è collegato alla nuova UI.

## Prossimi passi (in ordine di priorità)

1. **Attivare l'assistente AI**: ottenere una chiave API Groq (gratis su https://console.groq.com), fare il deploy della funzione Supabase, configurare l'endpoint nel file `.env.local`
2. **Testare il riconoscimento YOLO nel corridoio reale**: il modello è integrato e funzionante in locale — verificare le detection sul campo (Edificio B, 2° piano, ala ovest) e ri-allenare se necessario con più immagini
3. **Generare e stampare i QR code fisici**: ogni QR codifica un URL del tipo `/landing?loc=<codice-posizione>`
4. **Estendere la mappa oltre il singolo corridoio**: collegare il grafo completo del backend (più edifici e piani) alla nuova interfaccia
5. **Deploy in produzione su Vercel**: il codice è già su GitHub (commit `052c612`) — serve triggerare il build su Vercel (il webhook automatico non si è attivato; dc-09 deve configurarlo o usare `npx vercel --prod` da `web/`)
6. **Test su utenti reali** in campus

## Problemi noti

- **I nomi delle destinazioni recenti non si traducono dopo il salvataggio**: se salvi "Aula 21 W" in italiano e poi cambi lingua, resta in italiano. Soluzione facile per il futuro — salvare l'ID e tradurre al momento.
- **iOS richiede un gesto utente per il sensore di orientamento**: oggi non lo usiamo (la freccia AR è guidata dallo store dell'app), ma se in futuro vogliamo orientare la freccia con la bussola va aggiunto un permesso esplicito.
- **Il vecchio frontend (`/frontend`) e l'iOS proof-of-concept (`/ios`) sono codice abbandonato**: vanno rimossi o archiviati per non creare confusione nel team.
- **La fotocamera richiede HTTPS**: per testare su telefono serve ngrok o un deploy Vercel. È documentato nel README.
- **Vercel non si aggiorna automaticamente**: il webhook GitHub di Vercel non ha triggerato al push `052c612`. dc-09 deve verificare le impostazioni di auto-deploy nel progetto Vercel o usare la CLI.
