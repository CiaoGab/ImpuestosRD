// Data sources for Dominican Republic tax / courier rules
// Keep this list small and official where possible.

export const SOURCES_DO = [
  {
    title: "DGA - Preguntas frecuentes (compras <= US$200 y tasa US$0.25/kg)",
    url: "https://www.aduanas.gob.do/preguntas-frecuentes/",
    note: "Incluye la aclaracion de que para envios via courier por debajo de US$200, el cobro de Aduanas es la tasa de servicio (Decreto 627-06)."
  },
  {
    title: "DGA - Decreto 627-06 (tasa de servicio aduanero, PDF)",
    url: "https://www.aduanas.gob.do/media/duqp0gql/627-06_que_reglamenta_art_14_ley_226-06.pdf",
    note: "Base legal de la tasa de servicio (incluye referencia a US$0.25 por kilo o fraccion, con tope por documento)."
  },
  {
    title: "DGII - ITBIS (definicion y aplicacion a importaciones)",
    url: "https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/principalesImpuestos/Paginas/Itbis.aspx",
    note: "Describe el ITBIS como un impuesto que aplica a la transferencia e importacion de bienes industrializados y servicios."
  },
  {
    title: "DGA - Registro Courier / RUA (plataforma oficial)",
    url: "https://rua.aduanas.gob.do/",
    note: "Portal oficial para el Registro de Usuarios de servicios courier (RUA)."
  },
  {
    title: "DGA - Norma General 01-2018 (courier; PDF)",
    url: "https://www.aduanas.gob.do/media/vf2nqfsy/norma-general-01-2018-sobre-envios-couriers-con-finalidad-comercial.pdf",
    note: "Norma que regula el fraccionamiento de mercancias a traves de empresas courier (origen del RUA)."
  }
];