/* Grupos de banderas clásicamente confundibles entre sí.
   Se usan como distractores prioritarios en Nivel Dios. */
export const CONFUSABLES = [
  ["td", "ro"],             // Chad / Rumanía
  ["id", "mc", "pl"],       // Indonesia / Mónaco / Polonia
  ["ie", "ci"],             // Irlanda / Costa de Marfil
  ["nl", "lu", "py", "cr"], // Países Bajos / Luxemburgo / Paraguay / Costa Rica
  ["co", "ec", "ve"],       // Colombia / Ecuador / Venezuela
  ["au", "nz"],             // Australia / Nueva Zelanda
  ["ru", "sk", "si", "hr"], // Rusia / Eslovaquia / Eslovenia / Croacia
  ["ml", "gn", "sn", "cm"], // Malí / Guinea / Senegal / Camerún
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

/* Devuelve los códigos "confundibles" con el país dado, si existen. */
export function confusablesFor(code) {
  const group = CONFUSABLES.find(g => g.includes(code));
  return group ? group.filter(c => c !== code) : [];
}
