# NTNU Emnevurderinger (DCST2002 Webutviklingsprosjekt h24)
Dette er en side for å legge inn emner + anmeldelser av emner på NTNU. Man velger hvilket campus og fagområde man vil legge inn emner under, og legger inn anmeldelse der.

# Innhold
- [Hovedfunksjon](#Hovedfunksjon)
- [Teknologier](#Teknologier)
    - [Bruk av KI-verktøy](#Bruk-av-KI-verktøy) 
- [Database oppsett](#Database-oppsett)
    - [SQL-setninger](#SQL-setninger)
    - [Tabeller uten avhengigheter](#Tabeller-uten-avhengigheter)
    - [Moderator](#Moderator)
    - [Tabeller som avhenger av nivå 1-tabeller](#Tabeller-som-avhenger-av-nivå-1-tabeller)
    - [Tabeller som avhenger av nivå 2-tabeller](#Tabeller-som-avhenger-av-nivå-2-tabeller)
    - [Tabeller som refererer til Subjects](#Tabeller-som-refererer-til-Subjects)
    - [Tabeller som refererer til flere tidligere nivåer](#Tabeller-som-refererer-til-flere-tidligere-nivåer)
- [Installasjon](#Installasjon)
- [Server tester](#Server-tester)
- [Klient tester](#Klient-tester)
- [Versjonering](#Versjonering)
- [Bidrag](#Bidrag)
- [Kilder og lisens](#Kilder-og-lisens)



## Hovedfunksjoner 
- Ved å opprette en bruker får man muligheten til å legge til fag, samt opprette, redigere og slette egne anmeldelser. Uten en bruker kan man ikke opprette egne anmeldelser, men man kan fortsatt lese anmeldelser fra andre. 
- Plattformen har en moderatorbruker som har rettigheter til alt. Denne brukeren kan slette og redigere emner. Moderator kan også slette anmeldelser. 
- Søkefunksjonalitet: Brukere kan søke etter emner, og ved å klikke på emnet blir de ført til siden med anmeldelser. 
- Versjoneringskontroll: På forsiden har man tilgang på en logg som viser hva som har blitt gjort når og av hvem. 
- Database: Plattformen bruker en database for å kunne lagre at av data, og deretter hente den ut.

## Teknologier
- Språk: TS, CSS, JS, HTML  
- Bibliotek: React 
- Databaser, SQL
- Frontend, Client
- Backend, Server

### Bruk av KI-verktøy
I utviklingen av dette prosjektet har disse KI-verktøyene blir benyttet:
- OpenAI ChatGPT 4o
- Github Copilot
  
## Database oppsett

Du må logge deg inn på databasen vår (mysqladmin.it.ntnu.no). Du finner innlogging på config.ts i /server (Vanligvis ville denne vært i .gitignore, men siden dette er et prosjekt vi skal levere, gjør vi det slik. Vi legger ikke ut påloggingsinformasjon offentlig). 
Husk at du må være på på NTNU-nett, eller VPN hvis du befinner deg et annet sted enn på campus. 

### SQL - Setninger
Hvis du vil lage dine egne databaser, må du bruke SQL-setningene under. Da er det noen ting som er viktige å tenke på:
- User_id på moderator-brukeren må være 35. Så det er viktig at du legger inn moderator som user_id 35.
- Legg de inn i rekkefølgen de står i.

### Tabeller uten avhengigheter
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
### Moderator
Denne insert-setningen bør kjøres med en gang etter at user-tabellen er opprettet, da user id bruker AUTO_INCREMENT, og id 35 må holdes av for moderator.
```sql

INSERT INTO users (id, name, email, password, created_at)
VALUES (35, 'Moderator', 'moderator@ntnu.no', 
        SHA2('moderator', 256), NOW());


```

### Tabeller som avhenger av nivå 1-tabeller
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

### Tabeller som avhenger av nivå 2-tabeller
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

### Tabeller som refererer til Subjects
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

### Tabeller som refererer til flere tidligere nivåer
Tabeller som avhenger både av Subjects, Fields, eller andre:

```sql

CREATE TABLE page (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    fieldId INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (fieldId) REFERENCES Fields(id)
);

INSERT INTO page (id, name, fieldId) VALUES
(1, 'Matematikk', 6),
(2, 'Programmering', 7),
(3, 'Nettverk', 8),
(4, 'Cybersikkerhet', 9),
(5, 'Statsvitenskap', 10);

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

3. Naviger til prosjektmappen din:
    ```bash
    cd 'prosjektnavn'
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

## Server Tester

Kjør testene på serveren:

```sh
cd server
npm test
```

### Informasjon om Server Tester

## Klient Tester

Kjør testene på klienten

```sh
cd client
npm test
```

### Informasjon om Klient Tester
Vi har tester på klient siden for å sørge for at applikasjonen vil fungere som forventet når det kommer til brukeropplevelse og kommunikasjon med API.
Utviklingen av testene er basert på leksjonen som omhandler klient tester, men fått hjelp med rettting av ChatGPT og Github Copilot.

Link til leksjon: https://eidheim.folk.ntnu.no/full_stack/client-tests/chapter.html

Filene som er testet:
- endringslogg.tsx
- review-service.tsx
- searchbar.tsx
- starrating.tsx
- subjectsByField.tsx
- widgets.tsx

## Versjonering

På grunn av mangel på eksempler og forklaringer på implementering som kunne tilpasses vårt prosjekt ble Chat GPT brukt for å lage en generell regel på hvordan det skal se ut. Deretter ble det utviklet selv basert på dette, med retting ved help av KI-verktøy.

## Bidrag
Dette prosjektet er utviklet av:
- Hilde Olsen
- Thea Hilmo Jensen
- Mathilde Lindkvist
- Sara Ødeby

Vi er 4 studenter som går 2. klasse Digital Infrastruktur og Cybersikkerhet ved NTNU Trondheim

## Kilder og Lisens
- https://github.com/eman289/smart-login-system
- https://www.w3schools.com/howto/howto_css_searchbar.asp
- https://stackademic.com/blog/how-to-implement-a-reusable-modal-component-in-react-and-typescript
- https://www.browserstack.com/guide/react-testing-tutorial
