# Cloudflare Setup & Configuratie Handleiding

Deze handleiding legt stap-voor-stap uit hoe je Cloudflare inricht voor het **Hiking Companion** project om de Test- en Productieomgevingen kosteloos te hosten via Cloudflare Pages (frontend PWA), Cloudflare Workers (backend API) en Cloudflare D1 (relationele SQLite database).

---

## 1. Cloudflare Account ID Opzoeken

1. Log in op het [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Selecteer een domein in je account of klik in de linker navigatiebalk op **Workers & Pages** -> **Overview**.
3. Kijk in de rechterkolom onder **Account Details** (of kopieer de ID uit de URL: `dash.cloudflare.com/<ACCOUNT_ID>/...`).
4. Noteer deze **Account ID**. Dit is de waarde voor de secret `CLOUDFLARE_ACCOUNT_ID`.

---

## 2. Cloudflare API Token Aanmaken

Om GitHub Actions geautomatiseerd deployments te laten uitvoeren, maken we een minimaal bevoegde (scoped) API Token aan:

1. Ga in Cloudflare rechtsboven naar **My Profile** -> **API Tokens**.
2. Klik op **Create Token**.
3. Kies onderaan voor **Custom Token** -> **Get started**.
4. Vul de gegevens als volgt in:
   - **Token name**: `hiking-companion-ci-cd`
   - **Permissions**:
     - *Account* | *Cloudflare Pages* | **Edit**
     - *Account* | *Workers Scripts* | **Edit**
     - *Account* | *D1* | **Edit**
     - *Account* | *Workers KV Storage* | **Edit**
     - *User* | *Memberships* | **Read**
   - **Account Resources**:
     - *Include* | *All accounts* (of selecteer je specifieke account)
5. Klik op **Continue to summary** en vervolgens op **Create Token**.
6. **Belangrijk**: Kopieer het gegenereerde token direct en sla het tijdelijk veilig op (je krijgt het maar één keer te zien). Dit is de waarde voor `CLOUDFLARE_API_TOKEN`.

---

## 3. Cloudflare Pages Projecten Aanmaken

We hebben twee Pages-projecten nodig: één voor de Testomgeving (`hiking-companion-test`) en één voor Productie (`hiking-companion`). Dit kan via de terminal (snelst) of via het Cloudflare Dashboard.

### Optie A: Direct via de terminal (Aanbevolen & Snelst)
Voer de volgende commando's uit in de terminal (in de root van het project):

```bash
# 1. Test project aanmaken
npx wrangler pages project create hiking-companion-test --production-branch main

# 2. Productie project aanmaken
npx wrangler pages project create hiking-companion --production-branch main
```
*(Als je nog niet bent ingelogd in Wrangler opent Cloudflare automatisch een browserscherm om éénmalig in te loggen).*

---

### Optie B: Via het Cloudflare Dashboard
Cloudflare heeft recent een vernieuwde **"Create an app"** interface geïntroduceerd.

1. Ga in het Cloudflare Dashboard naar **Workers & Pages** -> **Create application**.
2. **Nieuwe interface**:
   - Klik op **Upload your static files** (het gele map-icoontje).
   - Sleep de map `apps/web/dist` (of een tijdelijk bestandje) in het uploadvak.
   - Klik op **Deploy** en geef het project de juiste naam:
     - Voor Test: `hiking-companion-test` (beschikbaar op `https://hiking-companion-test.pages.dev`).
     - Voor Productie: `hiking-companion` (beschikbaar op `https://hiking-companion.pages.dev`).
3. **Klassieke Pages-interface (alternatief)**:
   - Klik onderaan het scherm op de tekstlink: **`Continue to Pages`** (*"Need to use the legacy Pages workflow? Continue to Pages"*).
   - Kies voor **Upload assets** (Direct Upload), vul de projectnaam in en klik op **Create project**.

---

## 4. Cloudflare D1 Databases Aanmaken

Voor typesafe opslag van gebruikers, accounts en sessies maken we twee gratis D1 databases aan via het dashboard of via de CLI:

```bash
# 1. Test database aanmaken
npx wrangler d1 create hiking-companion-db-test

# 2. Productie database aanmaken
npx wrangler d1 create hiking-companion-db-prod
```

Kopieer de resulterende `database_id` waarden naar `apps/api/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "hiking-companion-db-prod"
database_id = "<PROD_DATABASE_ID>"

[env.test]
name = "hiking-companion-api-test"
[[env.test.d1_databases]]
binding = "DB"
database_name = "hiking-companion-db-test"
database_id = "<TEST_DATABASE_ID>"
```

---

## 5. Custom Domeinen Koppelen (Optioneel)

Als je een eigen domein beheert in Cloudflare (bijv. `hikecompanion.nl`):

1. **Productie Frontend**:
   - Ga in Pages naar het project `hiking-companion` -> **Custom domains** -> **Set up a custom domain**.
   - Vul in: `hikecompanion.nl` en `www.hikecompanion.nl`.
2. **Test Frontend**:
   - Ga in Pages naar het project `hiking-companion-test` -> **Custom domains**.
   - Vul in: `test.hikecompanion.nl`.
3. **API Routes / Worker Routes**:
   - De API Worker kan worden gekoppeld via **Triggers** -> **Custom Domains** (bijv. `api.hikecompanion.nl` en `api-test.hikecompanion.nl`) of via Cloudflare Pages Route Proxy rules.
