function normalizeCity(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function cityKey(uf: string, city: string): string {
  return `${uf.toUpperCase()}|${normalizeCity(city)}`;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

const CITY_PAIR_DISTANCES: Record<string, number> = {
  [pairKey(cityKey("GO", "Rio Verde"), cityKey("MG", "Patos de Minas"))]: 530,
  [pairKey(cityKey("GO", "Rio Verde"), cityKey("SP", "São Paulo"))]: 935,
  [pairKey(cityKey("GO", "Rio Verde"), cityKey("DF", "Brasília"))]: 415,
  [pairKey(cityKey("GO", "Rio Verde"), cityKey("GO", "Goiânia"))]: 220,
  [pairKey(cityKey("GO", "Rio Verde"), cityKey("BA", "Salvador"))]: 1830,
  [pairKey(cityKey("GO", "Rio Verde"), cityKey("MG", "Belo Horizonte"))]: 870,

  [pairKey(cityKey("GO", "Anápolis"), cityKey("SP", "São Paulo"))]: 985,
  [pairKey(cityKey("GO", "Anápolis"), cityKey("GO", "Goiânia"))]: 55,
  [pairKey(cityKey("GO", "Anápolis"), cityKey("DF", "Brasília"))]: 155,
  [pairKey(cityKey("GO", "Anápolis"), cityKey("MG", "Belo Horizonte"))]: 880,

  [pairKey(cityKey("GO", "Goiânia"), cityKey("SP", "São Paulo"))]: 920,
  [pairKey(cityKey("GO", "Goiânia"), cityKey("DF", "Brasília"))]: 210,
  [pairKey(cityKey("GO", "Goiânia"), cityKey("MG", "Belo Horizonte"))]: 905,
  [pairKey(cityKey("GO", "Goiânia"), cityKey("RJ", "Rio de Janeiro"))]: 1290,
  [pairKey(cityKey("GO", "Goiânia"), cityKey("MG", "Uberlândia"))]: 425,
  [pairKey(cityKey("GO", "Goiânia"), cityKey("BA", "Salvador"))]: 1605,
  [pairKey(cityKey("GO", "Goiânia"), cityKey("MS", "Campo Grande"))]: 935,
  [pairKey(cityKey("GO", "Goiânia"), cityKey("TO", "Palmas"))]: 875,

  [pairKey(cityKey("MG", "Belo Horizonte"), cityKey("SP", "São Paulo"))]: 590,
  [pairKey(cityKey("MG", "Belo Horizonte"), cityKey("RJ", "Rio de Janeiro"))]: 440,
  [pairKey(cityKey("MG", "Uberlândia"), cityKey("SP", "São Paulo"))]: 590,

  [pairKey(cityKey("DF", "Brasília"), cityKey("SP", "São Paulo"))]: 1015,
  [pairKey(cityKey("DF", "Brasília"), cityKey("MG", "Belo Horizonte"))]: 740,
  [pairKey(cityKey("DF", "Brasília"), cityKey("BA", "Salvador"))]: 1450,

  [pairKey(cityKey("MS", "Campo Grande"), cityKey("SP", "São Paulo"))]: 985,
  [pairKey(cityKey("BA", "Salvador"), cityKey("SP", "São Paulo"))]: 1960,
  [pairKey(cityKey("RJ", "Rio de Janeiro"), cityKey("SP", "São Paulo"))]: 430,
};

const STATE_PAIR_DISTANCES: Record<string, number> = {
  [pairKey("GO", "GO")]: 250,
  [pairKey("GO", "DF")]: 210,
  [pairKey("GO", "SP")]: 920,
  [pairKey("GO", "MG")]: 730,
  [pairKey("GO", "MS")]: 850,
  [pairKey("GO", "BA")]: 1580,
  [pairKey("GO", "TO")]: 700,
  [pairKey("GO", "RJ")]: 1300,

  [pairKey("MG", "MG")]: 350,
  [pairKey("MG", "SP")]: 600,
  [pairKey("MG", "RJ")]: 440,
  [pairKey("MG", "DF")]: 740,
  [pairKey("MG", "BA")]: 1370,
  [pairKey("MG", "MS")]: 1100,
  [pairKey("MG", "TO")]: 1500,

  [pairKey("SP", "SP")]: 280,
  [pairKey("SP", "RJ")]: 430,
  [pairKey("SP", "MS")]: 1000,
  [pairKey("SP", "BA")]: 1960,
  [pairKey("SP", "DF")]: 1015,
  [pairKey("SP", "TO")]: 1690,

  [pairKey("DF", "DF")]: 50,
  [pairKey("DF", "BA")]: 1450,
  [pairKey("DF", "MS")]: 1130,
  [pairKey("DF", "RJ")]: 1150,
  [pairKey("DF", "TO")]: 800,

  [pairKey("MS", "MS")]: 350,
  [pairKey("MS", "BA")]: 2200,
  [pairKey("MS", "RJ")]: 1450,
  [pairKey("MS", "TO")]: 1500,

  [pairKey("BA", "BA")]: 600,
  [pairKey("BA", "RJ")]: 1650,
  [pairKey("BA", "TO")]: 1400,

  [pairKey("RJ", "RJ")]: 200,
  [pairKey("RJ", "TO")]: 2050,

  [pairKey("TO", "TO")]: 400,
};

export function estimateDistanceKm(
  origemUF: string | null,
  origemCidade: string | null,
  destinoUF: string | null,
  destinoCidade: string | null,
): number | null {
  if (!origemUF || !destinoUF) return null;
  const ufA = origemUF.toUpperCase();
  const ufB = destinoUF.toUpperCase();

  if (origemCidade && destinoCidade) {
    const k = pairKey(cityKey(ufA, origemCidade), cityKey(ufB, destinoCidade));
    if (k in CITY_PAIR_DISTANCES) return CITY_PAIR_DISTANCES[k];
  }

  const stateK = pairKey(ufA, ufB);
  return STATE_PAIR_DISTANCES[stateK] ?? null;
}
