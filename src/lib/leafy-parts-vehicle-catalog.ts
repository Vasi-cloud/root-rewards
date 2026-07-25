/**
 * Leafy Parts Finder — vehicle Make / Model / Year catalog.
 * Years are inclusive production windows used to filter the Year dropdown.
 */

export const YEAR_MIN = 2000;
export const YEAR_MAX = 2026;

export type VehicleMakeId =
  | "alfa-romeo"
  | "audi"
  | "bmw"
  | "chevrolet"
  | "citroen"
  | "cupra"
  | "dacia"
  | "fiat"
  | "ford"
  | "honda"
  | "hyundai"
  | "jaguar"
  | "kia"
  | "land-rover"
  | "mazda"
  | "mercedes"
  | "mini"
  | "nissan"
  | "opel"
  | "peugeot"
  | "porsche"
  | "renault"
  | "seat"
  | "skoda"
  | "subaru"
  | "suzuki"
  | "tesla"
  | "toyota"
  | "volkswagen"
  | "volvo";

export type VehicleModel = {
  id: string;
  label: string;
  /** Inclusive first model year in catalog window */
  yearFrom: number;
  /** Inclusive last model year in catalog window */
  yearTo: number;
};

export type VehicleMakeEntry = {
  label: string;
  models: VehicleModel[];
};

function m(
  id: string,
  label: string,
  yearFrom: number,
  yearTo: number = YEAR_MAX
): VehicleModel {
  return {
    id,
    label,
    yearFrom: Math.max(YEAR_MIN, yearFrom),
    yearTo: Math.min(YEAR_MAX, yearTo),
  };
}

/** Full Make → Model → Year catalog (EU-weighted + common global brands). */
export const VEHICLE_CATALOG: Record<VehicleMakeId, VehicleMakeEntry> = {
  "alfa-romeo": {
    label: "Alfa Romeo",
    models: [
      m("giulia", "Giulia", 2016),
      m("stelvio", "Stelvio", 2017),
      m("tonale", "Tonale", 2022),
      m("giulietta", "Giulietta", 2010, 2020),
      m("mito", "MiTo", 2008, 2018),
      m("junior", "Junior", 2024),
      m("159", "159", 2005, 2011),
    ],
  },
  audi: {
    label: "Audi",
    models: [
      m("a1", "A1", 2010),
      m("a3", "A3", 2000),
      m("a4", "A4", 2000),
      m("a5", "A5", 2007),
      m("a6", "A6", 2000),
      m("q2", "Q2", 2016),
      m("q3", "Q3", 2011),
      m("q5", "Q5", 2008),
      m("q7", "Q7", 2006),
      m("q8", "Q8", 2018),
      m("e-tron", "Q4 e-tron", 2021),
      m("tt", "TT", 2000, 2023),
    ],
  },
  bmw: {
    label: "BMW",
    models: [
      m("1-series", "1 Series", 2004),
      m("2-series", "2 Series", 2014),
      m("3-series", "3 Series", 2000),
      m("4-series", "4 Series", 2013),
      m("5-series", "5 Series", 2000),
      m("x1", "X1", 2009),
      m("x2", "X2", 2018),
      m("x3", "X3", 2003),
      m("x4", "X4", 2014),
      m("x5", "X5", 2000),
      m("i3", "i3", 2013, 2022),
      m("i4", "i4", 2021),
      m("ix", "iX", 2021),
    ],
  },
  chevrolet: {
    label: "Chevrolet",
    models: [
      m("silverado", "Silverado", 2000),
      m("equinox", "Equinox", 2005),
      m("malibu", "Malibu", 2000),
      m("traverse", "Traverse", 2009),
      m("bolt", "Bolt EV", 2017, 2023),
      m("tahoe", "Tahoe", 2000),
      m("spark", "Spark", 2010, 2022),
    ],
  },
  citroen: {
    label: "Citroën",
    models: [
      m("c1", "C1", 2005, 2022),
      m("c3", "C3", 2002),
      m("c3-aircross", "C3 Aircross", 2017),
      m("c4", "C4", 2004),
      m("c4-cactus", "C4 Cactus", 2014, 2020),
      m("c5-aircross", "C5 Aircross", 2018),
      m("berlingo", "Berlingo", 2000),
      m("c5-x", "C5 X", 2021),
      m("ami", "Ami", 2020),
      m("spacetourer", "SpaceTourer", 2016),
    ],
  },
  cupra: {
    label: "Cupra",
    models: [
      m("formentor", "Formentor", 2020),
      m("leon", "León", 2020),
      m("ateca", "Ateca", 2018),
      m("born", "Born", 2021),
      m("terramar", "Terramar", 2024),
      m("tavascan", "Tavascan", 2024),
    ],
  },
  dacia: {
    label: "Dacia",
    models: [
      m("sandero", "Sandero", 2008),
      m("duster", "Duster", 2010),
      m("logan", "Logan", 2004),
      m("jogger", "Jogger", 2021),
      m("spring", "Spring", 2021),
      m("lodgy", "Lodgy", 2012, 2022),
      m("dokker", "Dokker", 2012, 2021),
      m("bigster", "Bigster", 2025),
    ],
  },
  fiat: {
    label: "Fiat",
    models: [
      m("500", "500", 2007),
      m("500x", "500X", 2014),
      m("500l", "500L", 2012, 2022),
      m("panda", "Panda", 2003),
      m("tipo", "Tipo", 2015),
      m("punto", "Punto", 2000, 2018),
      m("doblo", "Doblo", 2000),
      m("ducato", "Ducato", 2000),
    ],
  },
  ford: {
    label: "Ford",
    models: [
      m("fiesta", "Fiesta", 2000, 2023),
      m("focus", "Focus", 2000),
      m("mondeo", "Mondeo", 2000, 2022),
      m("puma", "Puma", 2019),
      m("kuga", "Kuga / Escape", 2008),
      m("ecosport", "EcoSport", 2012, 2022),
      m("explorer", "Explorer", 2000),
      m("mustang", "Mustang", 2005),
      m("transit-custom", "Transit Custom", 2012),
      m("f-150", "F-150", 2000),
      m("bronco", "Bronco", 2021),
    ],
  },
  honda: {
    label: "Honda",
    models: [
      m("civic", "Civic", 2000),
      m("accord", "Accord", 2000),
      m("cr-v", "CR-V", 2000),
      m("hr-v", "HR-V", 2015),
      m("jazz", "Jazz / Fit", 2001),
      m("pilot", "Pilot", 2003),
      m("e", "Honda e", 2020, 2024),
    ],
  },
  hyundai: {
    label: "Hyundai",
    models: [
      m("i10", "i10", 2007),
      m("i20", "i20", 2008),
      m("i30", "i30", 2007),
      m("tucson", "Tucson", 2004),
      m("santa-fe", "Santa Fe", 2001),
      m("kona", "Kona", 2017),
      m("ioniq-5", "Ioniq 5", 2021),
      m("ioniq-6", "Ioniq 6", 2022),
      m("elantra", "Elantra / i30 Sedan", 2000),
    ],
  },
  jaguar: {
    label: "Jaguar",
    models: [
      m("xe", "XE", 2015, 2024),
      m("xf", "XF", 2008),
      m("f-pace", "F-PACE", 2016),
      m("e-pace", "E-PACE", 2017),
      m("i-pace", "I-PACE", 2018),
      m("f-type", "F-TYPE", 2013),
    ],
  },
  kia: {
    label: "Kia",
    models: [
      m("picanto", "Picanto", 2004),
      m("rio", "Rio", 2000),
      m("ceed", "Ceed", 2006),
      m("sportage", "Sportage", 2000),
      m("sorento", "Sorento", 2002),
      m("niro", "Niro", 2016),
      m("ev6", "EV6", 2021),
      m("stonic", "Stonic", 2017),
      m("soul", "Soul", 2008),
    ],
  },
  "land-rover": {
    label: "Land Rover",
    models: [
      m("defender", "Defender", 2020),
      m("discovery", "Discovery", 2000),
      m("discovery-sport", "Discovery Sport", 2014),
      m("range-rover", "Range Rover", 2002),
      m("range-rover-sport", "Range Rover Sport", 2005),
      m("range-rover-evoque", "Range Rover Evoque", 2011),
      m("range-rover-velar", "Range Rover Velar", 2017),
      m("freelander", "Freelander", 2000, 2014),
    ],
  },
  mazda: {
    label: "Mazda",
    models: [
      m("mazda2", "Mazda2", 2003),
      m("mazda3", "Mazda3", 2003),
      m("mazda6", "Mazda6", 2002),
      m("cx-3", "CX-3", 2015, 2021),
      m("cx-30", "CX-30", 2019),
      m("cx-5", "CX-5", 2012),
      m("cx-60", "CX-60", 2022),
      m("mx-5", "MX-5", 2000),
    ],
  },
  mercedes: {
    label: "Mercedes-Benz",
    models: [
      m("a-class", "A-Class", 2000),
      m("b-class", "B-Class", 2005),
      m("c-class", "C-Class", 2000),
      m("e-class", "E-Class", 2000),
      m("cla", "CLA", 2013),
      m("gla", "GLA", 2013),
      m("glb", "GLB", 2019),
      m("glc", "GLC", 2015),
      m("gle", "GLE", 2015),
      m("eqa", "EQA", 2021),
      m("eqb", "EQB", 2021),
      m("eqc", "EQC", 2019, 2023),
      m("vito", "Vito", 2000),
    ],
  },
  mini: {
    label: "MINI",
    models: [
      m("hatch", "Hatch / Cooper", 2001),
      m("clubman", "Clubman", 2007),
      m("countryman", "Countryman", 2010),
      m("convertible", "Convertible", 2004),
      m("electric", "Cooper SE / Electric", 2020),
    ],
  },
  nissan: {
    label: "Nissan",
    models: [
      m("micra", "Micra", 2000),
      m("juke", "Juke", 2010),
      m("qashqai", "Qashqai", 2006),
      m("x-trail", "X-Trail / Rogue", 2001),
      m("leaf", "Leaf", 2010),
      m("navara", "Navara", 2005),
      m("note", "Note", 2006, 2020),
      m("pathfinder", "Pathfinder", 2005),
      m("ariya", "Ariya", 2022),
    ],
  },
  opel: {
    label: "Opel / Vauxhall",
    models: [
      m("corsa", "Corsa", 2000),
      m("astra", "Astra", 2000),
      m("insignia", "Insignia", 2008, 2022),
      m("mokka", "Mokka", 2012),
      m("crossland", "Crossland", 2017),
      m("grandland", "Grandland", 2017),
      m("combo", "Combo", 2001),
      m("zafira", "Zafira", 2000, 2019),
    ],
  },
  peugeot: {
    label: "Peugeot",
    models: [
      m("108", "108", 2014, 2021),
      m("208", "208", 2012),
      m("e-208", "e-208", 2019),
      m("308", "308", 2007),
      m("408", "408", 2022),
      m("508", "508", 2010),
      m("2008", "2008", 2013),
      m("3008", "3008", 2009),
      m("5008", "5008", 2009),
      m("rifter", "Rifter", 2018),
      m("partner", "Partner", 2000),
      m("expert", "Expert", 2007),
    ],
  },
  porsche: {
    label: "Porsche",
    models: [
      m("911", "911", 2000),
      m("cayenne", "Cayenne", 2002),
      m("macan", "Macan", 2014),
      m("panamera", "Panamera", 2009),
      m("taycan", "Taycan", 2019),
      m("boxster", "Boxster / 718", 2000),
    ],
  },
  renault: {
    label: "Renault",
    models: [
      m("twingo", "Twingo", 2000),
      m("clio", "Clio", 2000),
      m("megane", "Megane", 2000),
      m("scenic", "Scenic", 2000),
      m("megane-scenic", "Megane Scenic", 2000, 2016),
      m("captur", "Captur", 2013),
      m("kadjar", "Kadjar", 2015, 2022),
      m("arkana", "Arkana", 2020),
      m("austral", "Austral", 2022),
      m("koleos", "Koleos", 2008),
      m("talisman", "Talisman", 2015, 2022),
      m("espace", "Espace", 2000),
      m("trafic", "Trafic", 2001),
      m("master", "Master", 2000),
      m("zoe", "Zoe", 2012, 2024),
      m("megane-e-tech", "Megane E-Tech", 2022),
    ],
  },
  seat: {
    label: "SEAT",
    models: [
      m("ibiza", "Ibiza", 2000),
      m("leon", "León", 2000),
      m("ateca", "Ateca", 2016),
      m("arona", "Arona", 2017),
      m("tarraco", "Tarraco", 2018),
      m("alhambra", "Alhambra", 2000, 2020),
      m("born", "Born", 2021),
      m("toledo", "Toledo", 2000, 2019),
    ],
  },
  skoda: {
    label: "Škoda",
    models: [
      m("fabia", "Fabia", 2000),
      m("scala", "Scala", 2019),
      m("octavia", "Octavia", 2000),
      m("superb", "Superb", 2001),
      m("kamiq", "Kamiq", 2019),
      m("karoq", "Karoq", 2017),
      m("kodiaq", "Kodiaq", 2016),
      m("enyaq", "Enyaq", 2020),
      m("roomster", "Roomster", 2006, 2015),
    ],
  },
  subaru: {
    label: "Subaru",
    models: [
      m("impreza", "Impreza", 2000),
      m("legacy", "Legacy", 2000),
      m("outback", "Outback", 2000),
      m("forester", "Forester", 2000),
      m("xv", "XV / Crosstrek", 2012),
      m("ascent", "Ascent", 2018),
      m("brz", "BRZ", 2012),
    ],
  },
  suzuki: {
    label: "Suzuki",
    models: [
      m("swift", "Swift", 2000),
      m("vitara", "Vitara", 2015),
      m("s-cross", "S-Cross", 2013),
      m("jimny", "Jimny", 2018),
      m("ignis", "Ignis", 2016),
      m("alto", "Alto", 2000, 2014),
    ],
  },
  tesla: {
    label: "Tesla",
    models: [
      m("model-3", "Model 3", 2017),
      m("model-y", "Model Y", 2020),
      m("model-s", "Model S", 2012),
      m("model-x", "Model X", 2015),
    ],
  },
  toyota: {
    label: "Toyota",
    models: [
      m("aygo", "Aygo", 2005, 2021),
      m("aygo-x", "Aygo X", 2021),
      m("yaris", "Yaris", 2000),
      m("corolla", "Corolla", 2000),
      m("camry", "Camry", 2000),
      m("auris", "Auris", 2006, 2018),
      m("rav4", "RAV4", 2000),
      m("c-hr", "C-HR", 2016),
      m("prius", "Prius", 2000),
      m("highlander", "Highlander", 2001),
      m("land-cruiser", "Land Cruiser", 2000),
      m("hilux", "Hilux", 2005),
      m("proace", "Proace", 2013),
    ],
  },
  volkswagen: {
    label: "Volkswagen",
    models: [
      m("up", "up!", 2011, 2023),
      m("polo", "Polo", 2000),
      m("golf", "Golf", 2000),
      m("jetta", "Jetta", 2000),
      m("passat", "Passat", 2000),
      m("arteon", "Arteon", 2017),
      m("t-roc", "T-Roc", 2017),
      m("t-cross", "T-Cross", 2018),
      m("tiguan", "Tiguan", 2007),
      m("touareg", "Touareg", 2002),
      m("touran", "Touran", 2003),
      m("caddy", "Caddy", 2003),
      m("transporter", "Transporter / T6", 2003),
      m("id3", "ID.3", 2020),
      m("id4", "ID.4", 2020),
      m("idbuzz", "ID. Buzz", 2022),
    ],
  },
  volvo: {
    label: "Volvo",
    models: [
      m("v40", "V40", 2012, 2019),
      m("v60", "V60", 2010),
      m("v90", "V90", 2016),
      m("s60", "S60", 2000),
      m("s90", "S90", 2016),
      m("xc40", "XC40", 2017),
      m("xc60", "XC60", 2008),
      m("xc90", "XC90", 2002),
      m("c40", "C40 Recharge", 2021),
      m("ex30", "EX30", 2023),
    ],
  },
};

/** Newest → oldest across the full catalog window. */
export const YEAR_OPTIONS = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, i) => String(YEAR_MAX - i)
);

/** Stable A–Z order for Make dropdown. */
export const VEHICLE_MAKE_IDS = (
  Object.keys(VEHICLE_CATALOG) as VehicleMakeId[]
).sort((a, b) =>
  VEHICLE_CATALOG[a].label.localeCompare(VEHICLE_CATALOG[b].label)
);

export function modelsForMake(makeId: VehicleMakeId | ""): VehicleModel[] {
  if (!makeId) return [];
  return VEHICLE_CATALOG[makeId].models;
}

/** Years available for a Make + Model (newest first). Falls back to full range. */
export function yearsForModel(
  makeId: VehicleMakeId | "",
  modelId: string
): string[] {
  if (!makeId || !modelId) return YEAR_OPTIONS;
  const model = VEHICLE_CATALOG[makeId].models.find((x) => x.id === modelId);
  if (!model) return YEAR_OPTIONS;
  const from = Math.max(YEAR_MIN, model.yearFrom);
  const to = Math.min(YEAR_MAX, model.yearTo);
  if (to < from) return YEAR_OPTIONS;
  return Array.from({ length: to - from + 1 }, (_, i) => String(to - i));
}

export function formatVehicleLabel(details: {
  makeId: VehicleMakeId | "";
  modelId: string;
  year: string;
}): string {
  if (!details.makeId) return "your vehicle";
  const make = VEHICLE_CATALOG[details.makeId];
  const model =
    make.models.find((m) => m.id === details.modelId)?.label ?? "model";
  const year = details.year || "year";
  return `${year} ${make.label} ${model}`;
}
