/* Grupos de banderas clásicamente confundibles entre sí.
   Se usan como distractores prioritarios en Nivel Dios. */
export const CONFUSABLES = [
  ["td", "ro", "ad", "md"], // Chad / Rumanía / Andorra / Moldavia (azul-amarillo-rojo vertical)
  ["id", "mc", "pl"],       // Indonesia / Mónaco / Polonia
  ["ie", "ci"],             // Irlanda / Costa de Marfil
  ["it", "mx"],             // Italia / México (verde-blanco-rojo vertical)
  ["nl", "lu", "py", "cr"], // Países Bajos / Luxemburgo / Paraguay / Costa Rica
  ["co", "ec", "ve"],       // Colombia / Ecuador / Venezuela
  ["au", "nz", "fj"],       // Australia / Nueva Zelanda / Fiyi (Union Jack en el cantón)
  ["ru", "sk", "si", "hr"], // Rusia / Eslovaquia / Eslovenia / Croacia
  ["ml", "gn", "sn", "cm"], // Malí / Guinea / Senegal / Camerún
  ["gh", "gw"],             // Ghana / Guinea-Bisáu (rojo-amarillo-verde-negro)
  ["no", "is"],             // Noruega / Islandia
  ["pe", "ca"],             // Perú / Canadá
  ["ne", "in"],             // Níger / India
  ["qa", "bh"],             // Catar / Baréin
  ["li", "ht"],             // Liechtenstein / Haití
  ["sv", "ni", "hn"],       // El Salvador / Nicaragua / Honduras
  ["th", "cr"],             // Tailandia / Costa Rica
  ["ar", "uy"],             // Argentina / Uruguay
  ["fm", "so"],             // Micronesia / Somalia
  ["om", "ae"],             // Omán / Emiratos (verde-blanco-negro-rojo)
  ["kw", "jo"],             // Kuwait / Jordania (rojo-blanco-negro-verde)
];

/* Devuelve los códigos "confundibles" con el país dado, uniendo todos los
   grupos en los que aparezca (un país puede pertenecer a más de uno). */
export function confusablesFor(code) {
  const out = new Set();
  for (const group of CONFUSABLES) {
    if (group.includes(code)) for (const c of group) if (c !== code) out.add(c);
  }
  return [...out];
}
