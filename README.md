# NTNU Emnevurderinger (DCST2002 Webutviklingsprosjekt h24)
Dette er en side for å legge inn emner og anmeldelser av emner på NTNU. Man velger hvilket campus og fagområde man vil legge inn emner under, og legger inn anmeldelse der.

## Hovedfunksjoner 
- Ved å opprette en bruker får man muligheten til å legge til fag, samt opprette, redigere og slette egne anmeldelser. Uten en bruker kan man ikke opprette egne anmeldelser, men man kan fortsatt lese anmeldelser fra andre. 
- Plattformen har en moderatorbruker som har rettigheter til alt. Denne brukeren kan slette og redigere emner. Moderator kan også slette anmeldelser. 
- Søkefunksjonalitet: Brukere kan søke etter emner, og ved å klikke på emnet blir de ført til siden med anmeldelser. 
- Versjoneringskontroll: På forsiden har man tilgang på en logg som viser hva som har blitt gjort når og av hvem. 
- Database: Plattformen bruker en database for å kunne lagre alt av data, og deretter hente den ut.

## Teknologier
- Språk: TS, CSS, JS, HTML  
- Bibliotek: React 
- Databaser, SQL
- Frontend, Client
- Backend, Server
  
## Database oppsett

Du må logge deg inn på databasen vår (mysqladmin.it.ntnu.no). Du finner innlogging på config.ts i /server (Vanligvis ville denne vært i .gitignore, men siden dette er et prosjekt vi skal levere, gjør vi det slik. Vi legger ikke ut påloggingsinformasjon offentlig). 
Husk at du må være på på NTNU-nett, eller VPN hvis du befinner deg et annet sted enn på campus. 

## SQL - Setninger
Hvis du vil lage dine egne databaser, må du bruke SQL-setningene under. Da er det noen ting som er viktige å tenke på:
- Legg de inn i rekkefølgen de står i.

## Tabeller uten avhengigheter
Disse tabellene må opprettes først, fordi andre tabeller refererer til dem via fremmednøkler:

```sql

CREATE TABLE Campuses (
    campusId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (campusId)
);

INSERT INTO Campuses (campusId, name) VALUES
(4, 'Gløshaugen'),
(5, 'Dragvoll'),
(6, 'Øya'),
(7, 'Kalvskinnet'),
(8, 'Helgasetr');

CREATE TABLE Levels (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO Levels (id, name) VALUES
(1, 'Grunnleggende emner, nivå I'),
(2, 'Videregående emner, nivå II'),
(3, 'Høyere grads nivå'),
(5, 'Annet');

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id)
);
```

## Tabeller som avhenger av nivå 1-tabeller
Tabeller som refererer til Campuses, Levels, eller users via fremmednøkler:

```sql

CREATE TABLE Fields (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    campusId INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (campusId) REFERENCES Campuses(campusId)
);

INSERT INTO Fields (id, name, campusId) VALUES
(6, 'Matematikk', 4),
(7, 'Programmering', 4),
(8, 'Nettverk', 4),
(9, 'Cybersikkerhet', 4),
(10, 'Statsvitenskap', 5);
```

## Tabeller som avhenger av nivå 2-tabeller
Tabeller som refererer til Fields og/eller Levels:

```sql

CREATE TABLE Subjects (
    id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    fieldId INT NOT NULL,
    levelId INT NOT NULL,
    created_at DATETIME NOT NULL,
    description TEXT,
    view_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (fieldId) REFERENCES Fields(id),
    FOREIGN KEY (levelId) REFERENCES Levels(id)
);
```

## Tabeller som refererer til Subjects
Disse tabellene avhenger av Subjects og må opprettes etter at Subjects er definert:

```sql

CREATE TABLE Reviews (
    id INT NOT NULL AUTO_INCREMENT,
    subjectId VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    stars INT NOT NULL,
    user_id INT NOT NULL,
    submitterName VARCHAR(255) NOT NULL,
    created_date DATE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (subjectId) REFERENCES Subjects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE subject_review_versions (
    id INT NOT NULL AUTO_INCREMENT,
    subject_id VARCHAR(255) NOT NULL,
    version INT NOT NULL,
    reviews TEXT,
    created_at DATETIME NOT NULL,
    user_id INT NOT NULL,
    action_type VARCHAR(255),
    PRIMARY KEY (id),
    FOREIGN KEY (subject_id) REFERENCES Subjects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE subject_versions (
    version_id INT NOT NULL AUTO_INCREMENT,
    subject_id VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    version_number INT NOT NULL,
    created_at DATETIME NOT NULL,
    action_type VARCHAR(255),
    description TEXT,
    PRIMARY KEY (version_id),
    FOREIGN KEY (subject_id) REFERENCES Subjects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Tabeller som refererer til flere tidligere nivåer
Tabeller som avhenger både av Subjects, Fields, eller andre:

```sql

CREATE TABLE page_versions (
    version_id INT NOT NULL AUTO_INCREMENT,
    version_number INT NOT NULL,
    created_at DATETIME NOT NULL,
    field_id INT NOT NULL,
    subject_id VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    subject_ids TEXT,
    action_type VARCHAR(255),
    PRIMARY KEY (version_id),
    FOREIGN KEY (field_id) REFERENCES Fields(id),
    FOREIGN KEY (subject_id) REFERENCES Subjects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

```
## Installasjon
Følg disse stegene for å komme i gang:

1. Klon prosjektet:
    ```bash
    git clone https://github.com/Saraode/dcst2002.git
    ```
2. Database: 
   Hvis du vil bruke din egen database, må du sette opp dine egne variabler i config.ts
   `server/config.ts`:

    ```ts
    process.env.MYSQL_HOST = 'mysql.stud.ntnu.no';
    process.env.MYSQL_USER = 'username_todo';
    process.env.MYSQL_PASSWORD = 'username_todo';
    process.env.MYSQL_DATABASE = 'username_todo_dev';
    ```

3. Naviger til prosjektmappen:
    ```bash
    cd 'dcst2002'
    ```

4. Installer nødvendige avhengigheter:
    ```bash
    cd client
    npm install
    
    cd server
    npm install
    ```


5. Start applikasjonen:
    ```bash
    cd client
    npm start
    
    cd server
    npm start
    ```

6. Applikasjonen skal nå kjøre på `http://localhost:3000`.

## Moderator
Det er implementert moderatorfunksjonalitet hvor én bestemt bruker har autoritasjon til å slette og redigere alle fag og anmeldelser. Dette er gjort i koden ved at man har tilgang til disse funksjonene, dersom man er logget inn på bruker med bruker ID 35. Denne brukeren ligger klart i vår eksisterende database med følgende logg-inn informasjon:

**Epost:** moderator@ntnu.no

**Passord:** moderator

Dersom man oppretter egne databaser, vil koden automatisk generere en bruker med lik logg-inn informasjon, og med bruker ID 35. Dette skjer etter at den første brukeren opprettes på siden. Passordet blir hashet med bcrypt. 


## Server-tester

Kjør testene på serveren:

```sh
cd server
npm test
```

## Informasjon om server-tester

Til testing av backend er det brukt Jest og mocking. Testingen er blitt gjort med utgangspunkt i denne leksjonen https://olso.folk.ntnu.no/wu/testing-rest/testing-rest.html. 

Mocking er når vi erstatter ekte avhengigheter, som API-er eller databaser, med kontrollerbare, falske versjoner i testene våre. Dette gjør at vi kan isolere koden vi tester. Vi bruker mocking i vårt prosjekt for å sikre at testene våre er raske, stabile og ikke avhengige av eksterne systemer. Det gir oss også muligheten til å teste hvordan koden håndterer ulike scenarier, som feil eller timeout. Dette gjør det enklere å finne feil og forbedre kvaliteten på koden.

Det er opprettet en testfil for hver router og service fil, for god oversikt når testene blir kjørt. 

ChatGPT er brukt for feilsøking, samt ideer til flere tester, for å sikre god testdekning. 


## Klient-tester

Kjør testene på klienten

```sh
cd client
npm test
```

## Informasjon om klient-tester

## Bidrag
Dette prosjektet er utviklet av:
- Hilde Olsen
- Thea Hilmo Jensen
- Mathilde Lindkvist
- Sara Ødeby

Vi er 4 studenter som går 2. klasse Digital Infrastruktur og Cybersikkerhet ved NTNU Trondheim

## Kilder og Lisens
- https://github.com/eman289/smart-login-system -Logg inn systemet
- https://www.w3schools.com/howto/howto_css_searchbar.asp -Søkefeltet
- https://stackademic.com/blog/how-to-implement-a-reusable-modal-component-in-react-and-typescript -Versjonering frontend
- https://www.browserstack.com/guide/react-testing-tutorial -Frontend testing
