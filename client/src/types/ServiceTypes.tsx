// Representerer en anmeldelse av et emne
export type Review = {
  id: number; // ID for anmeldelsen
  text: string; // Innholdet i anmeldelsen
  stars: number; // Antall stjerner (vurdering)
  submitterName: string | null; // Navn på personen som har skrevet anmeldelsen (kan være null)
  userId: number; // ID for brukeren som har skrevet anmeldelsen
  created_date: string; // Dato og tidspunkt for når anmeldelsen ble opprettet
};

// Representerer et fag/emne
export type Subject = {
  id: string; // Fag-ID (for eksempel "MAT101")
  name: string; // Navn på faget
  fieldid: number; // ID for fagområdet (f.eks. teknologi, naturvitenskap)
  levelId: number; // ID for nivået (f.eks. bachelor, master)
  review: Review[]; // En liste med anmeldelser tilknyttet faget
  level?: string; // Mulig nivå (f.eks. "Bachelor", valgfritt felt)
  description: string; // Beskrivelse av faget
  view_count: number; // Antall visninger av faget
};

// Representerer et campus (f.eks. NTNU)
export type Campus = {
  campusId: number; // ID for campus
  name: string; // Navn på campus (f.eks. "Gløshaugen")
};

// Representerer et nivå for studier (f.eks. Bachelor, Master)
export type Level = {
  id: number; // ID for nivået
  name: string; // Navn på nivået (f.eks. "Bachelor", "Master")
};

// Representerer en historisk endring (for eksempel versjonslogg)
export type ChangeHistoryEntry = {
  version_number: number; // Versjonsnummer for endringen
  timestamp: string; // Tidspunkt for endringen
  user_name: string; // Navnet på brukeren som gjorde endringen
  action_type: string; // Type handling (f.eks. "Added", "Edited", "Deleted")
};

// Representerer et fagområde (f.eks. matematikk, informatikk)
export type Field = {
  id: number; // ID for fagområdet
  name: string; // Navn på fagområdet (f.eks. "Matematikk", "Informatikk")
};

// Representerer tilstanden for visningen av campuslisten (om historikk skal vises)
export type CampusListState = {
  showHistory: boolean; // Bestemmer om historikk skal vises eller ikke
};

// Representerer et resultat fra en søkefunksjon
export type SearchResult = {
  id: string; // ID for resultatet (f.eks. emne-ID)
  name: string; // Navn på resultatet (f.eks. emnenavn)
};
