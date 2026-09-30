/**
 * Runtime interface translation for PHVD (English, French, Spanish, Portuguese).
 *
 * The app's React components are untouched: this module translates the rendered
 * DOM and re-translates whatever React renders later (MutationObserver). The
 * original English is kept per text node, so switching back to EN restores it
 * exactly. Journal citations stay in English on purpose.
 *
 * Clinical abbreviations follow local usage:
 *   FR  IV (indice ventriculaire), LCA (largeur de la corne antérieure),
 *       DTO (distance thalamo-occipitale), IR, APM (âge postmenstruel)
 *   ES  IV, ACA (anchura del cuerno anterior), DTO, IR, EPM
 *   PT  IV, LCA (largura do corno anterior), DTO, IR, IPM
 */

type Lang = 'en' | 'fr' | 'es' | 'pt';

const SUPPORTED: Lang[] = ['en', 'fr', 'es', 'pt'];
const STORAGE_KEY = 'phvd-language';

const dictionaries: Record<Exclude<Lang, 'en'>, Record<string, string>> = {
  fr: {
    'VI': 'IV',
    'AHW': 'LCA',
    'TOD': 'DTO',
    'RI': 'IR',
    '97th%': '97e',
    'PHVD — Post-Haemorrhagic Ventricular Dilatation': 'PHVD — Dilatation ventriculaire post-hémorragique',
    // Shell
    'Post-Haemorrhagic Ventricular Dilatation': 'Dilatation ventriculaire post-hémorragique',
    'Educational reference only — not a diagnostic device. Clinical judgment required.':
      'Référence éducative uniquement, et non un dispositif diagnostique. Le jugement clinique reste requis.',
    'program tool': '— outil du programme',
    'PHVD is an': 'PHVD est un',
    // Disclaimer gate
    'Before you continue': 'Avant de continuer',
    'educational and reference tool for qualified healthcare professionals':
      'outil éducatif et de référence destiné aux professionnels de la santé qualifiés',
    '. It is not a medical device, does not provide a diagnosis, and does not replace clinical assessment or your local protocol.':
      '. Ce n’est pas un dispositif médical, il ne pose aucun diagnostic et ne remplace ni l’évaluation clinique ni votre protocole local.',
    'All outputs are indicative and must be independently verified.':
      'Tous les résultats sont indicatifs et doivent être vérifiés de façon indépendante.',
    'Do not use it as the sole basis for any treatment decision.':
      'Ne l’utilisez pas comme seule base d’une décision thérapeutique.',
    'No patient data is transmitted off this device.':
      'Aucune donnée de patient ne quitte cet appareil.',
    'Risk stratification adapted from El-Dib et al. (2020); reference curve from Brouwer et al. (2012).':
      'Stratification du risque adaptée d’El-Dib et coll. (2020); courbe de référence tirée de Brouwer et coll. (2012).',
    'I understand and accept': 'J’ai compris et j’accepte',
    // Header card
    'PHVD Risk Stratification': 'Stratification du risque de DVPH',
    'This module implements the risk stratification and management framework proposed by El-Dib et al. (2020). Enter ventricular measurements (VI, AHW, TOD) to calculate the risk zone.':
      'Ce module applique le cadre de stratification du risque et de prise en charge proposé par El-Dib et coll. (2020). Saisir les mesures ventriculaires (IV, LCA, DTO) pour obtenir la zone de risque.',
    'Definitions': 'Définitions',
    'VI:': 'IV :',
    'Ventricular Index (Levene)': 'Indice ventriculaire (Levene)',
    'AHW:': 'LCA :',
    'Anterior Horn Width': 'Largeur de la corne antérieure',
    'TOD:': 'DTO :',
    'Thalamo-Occipital Distance': 'Distance thalamo-occipitale',
    'RI:': 'IR :',
    'Resistive Index (recorded only)': 'Indice de résistance (consigné seulement)',
    'PMA:': 'APM :',
    'Post-Menstrual Age': 'Âge postmenstruel',
    // Assessment form
    'New Assessment': 'Nouvelle évaluation',
    'Reading image…': 'Lecture de l’image…',
    'Scan from ultrasound': 'Numériser depuis l’échographie',
    'No numbers detected. Try a closer, straighter photo of the measurement list.':
      'Aucun chiffre détecté. Prendre une photo plus rapprochée et mieux alignée de la liste des mesures.',
    'Could not read the image. Please try again.':
      'Impossible de lire l’image. Veuillez réessayer.',
    'Tap a number, then tap its field': 'Toucher un chiffre, puis son champ',
    'Clear detected numbers': 'Effacer les chiffres détectés',
    'cm is converted to mm automatically. You assign each number, since the app can’t tell VI from AHW or side:':
      'Les cm sont convertis en mm automatiquement. Vous attribuez chaque chiffre, car l’application ne distingue ni l’IV de la LCA ni le côté :',
    'straight caliper = VI, diagonal = AHW; screen-left = patient’s right.':
      'curseur droit = IV, diagonal = LCA; gauche à l’écran = droite du patient.',
    'Always verify against the screen before saving.':
      'Toujours vérifier à l’écran avant d’enregistrer.',
    'Date': 'Date',
    'PMA (Weeks)': 'APM (semaines)',
    'LEFT (mm)': 'GAUCHE (mm)',
    'RIGHT (mm)': 'DROITE (mm)',
    'Clinical Signs': 'Signes cliniques',
    'HC Growth > 2 cm/week': 'Croissance du PC > 2 cm/semaine',
    'Separated Sutures': 'Sutures écartées',
    'Bulging Fontanelle': 'Fontanelle bombée',
    'Save Measurement': 'Enregistrer la mesure',
    'Save assessment to Photos': 'Enregistrer l’évaluation dans Photos',
    'Download assessment image': 'Télécharger l’image de l’évaluation',
    'Saved to your Photos (PHVD album).': 'Enregistré dans vos Photos (album PHVD).',
    'Image downloaded.': 'Image téléchargée.',
    'Photos permission was denied.': 'L’accès aux photos a été refusé.',
    'Could not save the image. Please try again.':
      'Impossible d’enregistrer l’image. Veuillez réessayer.',
    'PMA must be between 24 and 42 weeks': 'L’APM doit se situer entre 24 et 42 semaines',
    // Risk zones
    'Low Risk - Observation': 'Risque faible – Observation',
    'Moderate Risk - Evaluation': 'Risque modéré – Évaluation',
    'High Risk - Intervention': 'Risque élevé – Intervention',
    'Observation in NICU': 'Observation à l’USIN',
    'Cranial US twice a week until stable for 2 weeks':
      'Échographie transfontanellaire deux fois par semaine jusqu’à 2 semaines de stabilité',
    'Then every 1-2 weeks till 34 weeks PMA':
      'Puis toutes les 1 à 2 semaines jusqu’à 34 semaines d’APM',
    'MRI at Term Equivalent': 'IRM à l’âge équivalent au terme',
    'Referral to regional center for neurosurgical review':
      'Orientation vers le centre régional pour évaluation neurochirurgicale',
    'Consider LP 2-3 times (remove 10ml/kg)':
      'Envisager 2 à 3 ponctions lombaires (retrait de 10 ml/kg)',
    'Cranial US 2-3x a week until stable for 2 weeks':
      'Échographie transfontanellaire 2 à 3 fois par semaine jusqu’à 2 semaines de stabilité',
    'Neurosurgical intervention if no stabilization occurs':
      'Intervention neurochirurgicale en l’absence de stabilisation',
    'Consider LP 2-3 times (temporizing)':
      'Envisager 2 à 3 ponctions lombaires (mesure temporisatrice)',
    'Neurosurgical intervention including either temporizing measures (Reservoir/VSGS) or VP Shunt':
      'Intervention neurochirurgicale, soit mesures temporisatrices (réservoir ou dérivation sous-galéale), soit dérivation ventriculo-péritonéale',
    'Measurements within stable range': 'Mesures dans un intervalle stable',
    'No clinical signs': 'Aucun signe clinique',
    'Rapid HC Growth (>2cm/wk)': 'Croissance rapide du PC (> 2 cm/semaine)',
    // Trend + plan
    'Ventricular Index Trend': 'Évolution de l’indice ventriculaire',
    'Clear History': 'Effacer l’historique',
    'P97 (Brouwer)': 'P97 (Brouwer)',
    'P97 + 4mm': 'P97 + 4 mm',
    'Your Data (Max VI)': 'Vos données (IV max)',
    'Management Plan': 'Plan de prise en charge',
    'Management plan': 'Plan de prise en charge',
    'Triggers': 'Éléments déclencheurs',
    'Post-Menstrual Age (Weeks)': 'Âge postmenstruel (semaines)',
    'Ventricular Index (mm)': 'Indice ventriculaire (mm)',
    // Report
    'PHVD Risk Assessment': 'Évaluation du risque de DVPH',
    'El-Dib et al. (2020) framework': 'Cadre d’El-Dib et coll. (2020)',
    'Date:': 'Date :',
    'Measure': 'Mesure',
    'Left (mm)': 'Gauche (mm)',
    'Right (mm)': 'Droite (mm)',
    'Decision-support / education aid only — not a diagnostic interpretation. Verify against the source images and your unit\'s protocol.':
      'Aide à la décision et outil éducatif seulement, et non une interprétation diagnostique. Vérifier avec les images sources et le protocole de votre unité.',
    // References section
    'References': 'Références',
    'The clinical logic in this app is drawn from the peer-reviewed literature below. Read the primary sources before applying any output to a patient.':
      'La logique clinique de cette application provient de la littérature révisée par les pairs ci-dessous. Consulter les sources primaires avant d’appliquer un résultat à un patient.',
    'Read the paper': 'Lire l’article',
    'Source of the Green / Yellow / Red risk-stratification framework and the management pathway shown in this app.':
      'Source du cadre de stratification du risque vert, jaune et rouge ainsi que du parcours de prise en charge présenté ici.',
    'Source of the ventricular index 97th-centile reference curve plotted against your measurements.':
      'Source de la courbe de référence du 97e centile de l’indice ventriculaire tracée avec vos mesures.',
    'This app is an educational and reference tool. It reproduces the published frameworks above for convenience; it does not extend, validate, or substitute for them, and it is not endorsed by their authors.':
      'Cette application est un outil éducatif et de référence. Elle reproduit les cadres publiés ci-dessus par commodité; elle ne les prolonge pas, ne les valide pas et ne s’y substitue pas, et n’est pas approuvée par leurs auteurs.',
    'Created by the Sarnat‑NNCC program': 'Créée par le programme Sarnat‑NNCC',
    'Neonatal Neuro‑Critical Care. Developed by Dr Khorshid Mohammad, staff neonatologist.':
      'Soins neurocritiques néonatals. Développée par le Dr Khorshid Mohammad, néonatologiste.',
    // Placeholders
    'e.g. 0.75': 'p. ex. 0,75',
    'L': 'G',
    'R': 'D',
  },
  es: {
    'VI': 'IV',
    'AHW': 'ACA',
    'TOD': 'DTO',
    'RI': 'IR',
    '97th%': 'P97',
    'PHVD — Post-Haemorrhagic Ventricular Dilatation': 'PHVD — Dilatación ventricular poshemorrágica',
    'Post-Haemorrhagic Ventricular Dilatation': 'Dilatación ventricular poshemorrágica',
    'Educational reference only — not a diagnostic device. Clinical judgment required.':
      'Referencia educativa únicamente, no es un dispositivo diagnóstico. Se requiere juicio clínico.',
    'program tool': '— herramienta del programa',
    'PHVD is an': 'PHVD es una',
    'Before you continue': 'Antes de continuar',
    'educational and reference tool for qualified healthcare professionals':
      'herramienta educativa y de referencia para profesionales de la salud cualificados',
    '. It is not a medical device, does not provide a diagnosis, and does not replace clinical assessment or your local protocol.':
      '. No es un dispositivo médico, no emite diagnósticos y no sustituye la evaluación clínica ni su protocolo local.',
    'All outputs are indicative and must be independently verified.':
      'Todos los resultados son orientativos y deben verificarse de forma independiente.',
    'Do not use it as the sole basis for any treatment decision.':
      'No la use como única base de ninguna decisión de tratamiento.',
    'No patient data is transmitted off this device.':
      'Ningún dato del paciente sale de este dispositivo.',
    'Risk stratification adapted from El-Dib et al. (2020); reference curve from Brouwer et al. (2012).':
      'Estratificación del riesgo adaptada de El-Dib et al. (2020); curva de referencia de Brouwer et al. (2012).',
    'I understand and accept': 'Entiendo y acepto',
    'PHVD Risk Stratification': 'Estratificación del riesgo de DVPH',
    'This module implements the risk stratification and management framework proposed by El-Dib et al. (2020). Enter ventricular measurements (VI, AHW, TOD) to calculate the risk zone.':
      'Este módulo aplica el marco de estratificación del riesgo y manejo propuesto por El-Dib et al. (2020). Ingrese las mediciones ventriculares (IV, ACA, DTO) para obtener la zona de riesgo.',
    'Definitions': 'Definiciones',
    'VI:': 'IV:',
    'Ventricular Index (Levene)': 'Índice ventricular (Levene)',
    'AHW:': 'ACA:',
    'Anterior Horn Width': 'Anchura del cuerno anterior',
    'TOD:': 'DTO:',
    'Thalamo-Occipital Distance': 'Distancia tálamo-occipital',
    'RI:': 'IR:',
    'Resistive Index (recorded only)': 'Índice de resistencia (solo registro)',
    'PMA:': 'EPM:',
    'Post-Menstrual Age': 'Edad posmenstrual',
    'New Assessment': 'Nueva evaluación',
    'Reading image…': 'Leyendo la imagen…',
    'Scan from ultrasound': 'Escanear desde la ecografía',
    'No numbers detected. Try a closer, straighter photo of the measurement list.':
      'No se detectaron números. Tome una foto más cercana y alineada de la lista de mediciones.',
    'Could not read the image. Please try again.':
      'No se pudo leer la imagen. Inténtelo de nuevo.',
    'Tap a number, then tap its field': 'Toque un número y luego su campo',
    'Clear detected numbers': 'Borrar los números detectados',
    'cm is converted to mm automatically. You assign each number, since the app can’t tell VI from AHW or side:':
      'Los cm se convierten a mm automáticamente. Usted asigna cada número, porque la aplicación no distingue el IV de la ACA ni el lado:',
    'straight caliper = VI, diagonal = AHW; screen-left = patient’s right.':
      'calibrador recto = IV, diagonal = ACA; izquierda en pantalla = derecha del paciente.',
    'Always verify against the screen before saving.':
      'Verifique siempre en la pantalla antes de guardar.',
    'Date': 'Fecha',
    'PMA (Weeks)': 'EPM (semanas)',
    'LEFT (mm)': 'IZQUIERDA (mm)',
    'RIGHT (mm)': 'DERECHA (mm)',
    'Clinical Signs': 'Signos clínicos',
    'HC Growth > 2 cm/week': 'Crecimiento del PC > 2 cm/semana',
    'Separated Sutures': 'Suturas separadas',
    'Bulging Fontanelle': 'Fontanela abombada',
    'Save Measurement': 'Guardar medición',
    'Save assessment to Photos': 'Guardar la evaluación en Fotos',
    'Download assessment image': 'Descargar la imagen de la evaluación',
    'Saved to your Photos (PHVD album).': 'Guardado en sus Fotos (álbum PHVD).',
    'Image downloaded.': 'Imagen descargada.',
    'Photos permission was denied.': 'Se denegó el acceso a Fotos.',
    'Could not save the image. Please try again.':
      'No se pudo guardar la imagen. Inténtelo de nuevo.',
    'PMA must be between 24 and 42 weeks': 'La EPM debe estar entre 24 y 42 semanas',
    'Low Risk - Observation': 'Riesgo bajo: observación',
    'Moderate Risk - Evaluation': 'Riesgo moderado: evaluación',
    'High Risk - Intervention': 'Riesgo alto: intervención',
    'Observation in NICU': 'Observación en la UCIN',
    'Cranial US twice a week until stable for 2 weeks':
      'Ecografía craneal dos veces por semana hasta 2 semanas de estabilidad',
    'Then every 1-2 weeks till 34 weeks PMA':
      'Después cada 1 o 2 semanas hasta las 34 semanas de EPM',
    'MRI at Term Equivalent': 'RM a la edad equivalente al término',
    'Referral to regional center for neurosurgical review':
      'Derivación al centro regional para valoración neuroquirúrgica',
    'Consider LP 2-3 times (remove 10ml/kg)':
      'Considerar 2 o 3 punciones lumbares (extraer 10 ml/kg)',
    'Cranial US 2-3x a week until stable for 2 weeks':
      'Ecografía craneal 2 o 3 veces por semana hasta 2 semanas de estabilidad',
    'Neurosurgical intervention if no stabilization occurs':
      'Intervención neuroquirúrgica si no se logra la estabilización',
    'Consider LP 2-3 times (temporizing)':
      'Considerar 2 o 3 punciones lumbares (medida temporizadora)',
    'Neurosurgical intervention including either temporizing measures (Reservoir/VSGS) or VP Shunt':
      'Intervención neuroquirúrgica, con medidas temporizadoras (reservorio o derivación subgaleal) o derivación ventriculoperitoneal',
    'Measurements within stable range': 'Mediciones dentro de un intervalo estable',
    'No clinical signs': 'Sin signos clínicos',
    'Rapid HC Growth (>2cm/wk)': 'Crecimiento rápido del PC (> 2 cm/semana)',
    'Ventricular Index Trend': 'Tendencia del índice ventricular',
    'Clear History': 'Borrar el historial',
    'P97 (Brouwer)': 'P97 (Brouwer)',
    'P97 + 4mm': 'P97 + 4 mm',
    'Your Data (Max VI)': 'Sus datos (IV máx.)',
    'Management Plan': 'Plan de manejo',
    'Management plan': 'Plan de manejo',
    'Triggers': 'Criterios activados',
    'Post-Menstrual Age (Weeks)': 'Edad posmenstrual (semanas)',
    'Ventricular Index (mm)': 'Índice ventricular (mm)',
    'PHVD Risk Assessment': 'Evaluación del riesgo de DVPH',
    'El-Dib et al. (2020) framework': 'Marco de El-Dib et al. (2020)',
    'Date:': 'Fecha:',
    'Measure': 'Medición',
    'Left (mm)': 'Izquierda (mm)',
    'Right (mm)': 'Derecha (mm)',
    'Decision-support / education aid only — not a diagnostic interpretation. Verify against the source images and your unit\'s protocol.':
      'Apoyo a la decisión y material educativo únicamente, no es una interpretación diagnóstica. Verifique con las imágenes originales y el protocolo de su unidad.',
    'References': 'Referencias',
    'The clinical logic in this app is drawn from the peer-reviewed literature below. Read the primary sources before applying any output to a patient.':
      'La lógica clínica de esta aplicación procede de la literatura revisada por pares que figura abajo. Lea las fuentes primarias antes de aplicar cualquier resultado a un paciente.',
    'Read the paper': 'Leer el artículo',
    'Source of the Green / Yellow / Red risk-stratification framework and the management pathway shown in this app.':
      'Fuente del marco de estratificación del riesgo verde, amarillo y rojo y de la vía de manejo que se muestra aquí.',
    'Source of the ventricular index 97th-centile reference curve plotted against your measurements.':
      'Fuente de la curva de referencia del percentil 97 del índice ventricular trazada con sus mediciones.',
    'This app is an educational and reference tool. It reproduces the published frameworks above for convenience; it does not extend, validate, or substitute for them, and it is not endorsed by their authors.':
      'Esta aplicación es una herramienta educativa y de referencia. Reproduce los marcos publicados por comodidad; no los amplía, valida ni sustituye, y no cuenta con el respaldo de sus autores.',
    'Created by the Sarnat‑NNCC program': 'Creada por el programa Sarnat‑NNCC',
    'Neonatal Neuro‑Critical Care. Developed by Dr Khorshid Mohammad, staff neonatologist.':
      'Cuidados neurocríticos neonatales. Desarrollada por el Dr. Khorshid Mohammad, neonatólogo.',
    'e.g. 0.75': 'p. ej., 0,75',
    'L': 'I',
    'R': 'D',
  },
  pt: {
    'VI': 'IV',
    'AHW': 'LCA',
    'TOD': 'DTO',
    'RI': 'IR',
    '97th%': 'P97',
    'PHVD — Post-Haemorrhagic Ventricular Dilatation': 'PHVD — Dilatação ventricular pós-hemorrágica',
    'Post-Haemorrhagic Ventricular Dilatation': 'Dilatação ventricular pós-hemorrágica',
    'Educational reference only — not a diagnostic device. Clinical judgment required.':
      'Referência educacional apenas, não é um dispositivo diagnóstico. O julgamento clínico é necessário.',
    'program tool': '— ferramenta do programa',
    'PHVD is an': 'O PHVD é uma',
    'Before you continue': 'Antes de continuar',
    'educational and reference tool for qualified healthcare professionals':
      'ferramenta educacional e de referência para profissionais de saúde qualificados',
    '. It is not a medical device, does not provide a diagnosis, and does not replace clinical assessment or your local protocol.':
      '. Não é um dispositivo médico, não fornece diagnóstico e não substitui a avaliação clínica nem o protocolo local.',
    'All outputs are indicative and must be independently verified.':
      'Todos os resultados são indicativos e devem ser verificados de forma independente.',
    'Do not use it as the sole basis for any treatment decision.':
      'Não a use como única base para qualquer decisão de tratamento.',
    'No patient data is transmitted off this device.':
      'Nenhum dado do paciente sai deste dispositivo.',
    'Risk stratification adapted from El-Dib et al. (2020); reference curve from Brouwer et al. (2012).':
      'Estratificação de risco adaptada de El-Dib et al. (2020); curva de referência de Brouwer et al. (2012).',
    'I understand and accept': 'Entendi e aceito',
    'PHVD Risk Stratification': 'Estratificação de risco da DVPH',
    'This module implements the risk stratification and management framework proposed by El-Dib et al. (2020). Enter ventricular measurements (VI, AHW, TOD) to calculate the risk zone.':
      'Este módulo aplica o modelo de estratificação de risco e manejo proposto por El-Dib et al. (2020). Insira as medidas ventriculares (IV, LCA, DTO) para obter a zona de risco.',
    'Definitions': 'Definições',
    'VI:': 'IV:',
    'Ventricular Index (Levene)': 'Índice ventricular (Levene)',
    'AHW:': 'LCA:',
    'Anterior Horn Width': 'Largura do corno anterior',
    'TOD:': 'DTO:',
    'Thalamo-Occipital Distance': 'Distância tálamo-occipital',
    'RI:': 'IR:',
    'Resistive Index (recorded only)': 'Índice de resistência (apenas registrado)',
    'PMA:': 'IPM:',
    'Post-Menstrual Age': 'Idade pós-menstrual',
    'New Assessment': 'Nova avaliação',
    'Reading image…': 'Lendo a imagem…',
    'Scan from ultrasound': 'Digitalizar da ultrassonografia',
    'No numbers detected. Try a closer, straighter photo of the measurement list.':
      'Nenhum número detectado. Faça uma foto mais próxima e alinhada da lista de medidas.',
    'Could not read the image. Please try again.':
      'Não foi possível ler a imagem. Tente novamente.',
    'Tap a number, then tap its field': 'Toque em um número e depois no campo dele',
    'Clear detected numbers': 'Limpar os números detectados',
    'cm is converted to mm automatically. You assign each number, since the app can’t tell VI from AHW or side:':
      'Os cm são convertidos em mm automaticamente. Você atribui cada número, pois o aplicativo não distingue o IV da LCA nem o lado:',
    'straight caliper = VI, diagonal = AHW; screen-left = patient’s right.':
      'cursor reto = IV, diagonal = LCA; esquerda da tela = direita do paciente.',
    'Always verify against the screen before saving.':
      'Sempre confira na tela antes de salvar.',
    'Date': 'Data',
    'PMA (Weeks)': 'IPM (semanas)',
    'LEFT (mm)': 'ESQUERDA (mm)',
    'RIGHT (mm)': 'DIREITA (mm)',
    'Clinical Signs': 'Sinais clínicos',
    'HC Growth > 2 cm/week': 'Crescimento do PC > 2 cm/semana',
    'Separated Sutures': 'Suturas separadas',
    'Bulging Fontanelle': 'Fontanela abaulada',
    'Save Measurement': 'Salvar medida',
    'Save assessment to Photos': 'Salvar a avaliação em Fotos',
    'Download assessment image': 'Baixar a imagem da avaliação',
    'Saved to your Photos (PHVD album).': 'Salvo nas suas Fotos (álbum PHVD).',
    'Image downloaded.': 'Imagem baixada.',
    'Photos permission was denied.': 'A permissão de acesso às Fotos foi negada.',
    'Could not save the image. Please try again.':
      'Não foi possível salvar a imagem. Tente novamente.',
    'PMA must be between 24 and 42 weeks': 'A IPM deve estar entre 24 e 42 semanas',
    'Low Risk - Observation': 'Risco baixo: observação',
    'Moderate Risk - Evaluation': 'Risco moderado: avaliação',
    'High Risk - Intervention': 'Risco alto: intervenção',
    'Observation in NICU': 'Observação na UTIN',
    'Cranial US twice a week until stable for 2 weeks':
      'Ultrassonografia craniana duas vezes por semana até 2 semanas de estabilidade',
    'Then every 1-2 weeks till 34 weeks PMA':
      'Depois a cada 1 a 2 semanas até 34 semanas de IPM',
    'MRI at Term Equivalent': 'RM na idade equivalente ao termo',
    'Referral to regional center for neurosurgical review':
      'Encaminhamento ao centro regional para avaliação neurocirúrgica',
    'Consider LP 2-3 times (remove 10ml/kg)':
      'Considerar 2 a 3 punções lombares (retirar 10 ml/kg)',
    'Cranial US 2-3x a week until stable for 2 weeks':
      'Ultrassonografia craniana 2 a 3 vezes por semana até 2 semanas de estabilidade',
    'Neurosurgical intervention if no stabilization occurs':
      'Intervenção neurocirúrgica se não houver estabilização',
    'Consider LP 2-3 times (temporizing)':
      'Considerar 2 a 3 punções lombares (medida temporizadora)',
    'Neurosurgical intervention including either temporizing measures (Reservoir/VSGS) or VP Shunt':
      'Intervenção neurocirúrgica, com medidas temporizadoras (reservatório ou derivação subgaleal) ou derivação ventriculoperitoneal',
    'Measurements within stable range': 'Medidas dentro de um intervalo estável',
    'No clinical signs': 'Sem sinais clínicos',
    'Rapid HC Growth (>2cm/wk)': 'Crescimento rápido do PC (> 2 cm/semana)',
    'Ventricular Index Trend': 'Tendência do índice ventricular',
    'Clear History': 'Limpar o histórico',
    'P97 (Brouwer)': 'P97 (Brouwer)',
    'P97 + 4mm': 'P97 + 4 mm',
    'Your Data (Max VI)': 'Seus dados (IV máx.)',
    'Management Plan': 'Plano de manejo',
    'Management plan': 'Plano de manejo',
    'Triggers': 'Critérios acionados',
    'Post-Menstrual Age (Weeks)': 'Idade pós-menstrual (semanas)',
    'Ventricular Index (mm)': 'Índice ventricular (mm)',
    'PHVD Risk Assessment': 'Avaliação do risco de DVPH',
    'El-Dib et al. (2020) framework': 'Modelo de El-Dib et al. (2020)',
    'Date:': 'Data:',
    'Measure': 'Medida',
    'Left (mm)': 'Esquerda (mm)',
    'Right (mm)': 'Direita (mm)',
    'Decision-support / education aid only — not a diagnostic interpretation. Verify against the source images and your unit\'s protocol.':
      'Apoio à decisão e material educacional apenas, não é uma interpretação diagnóstica. Confira com as imagens originais e o protocolo da sua unidade.',
    'References': 'Referências',
    'The clinical logic in this app is drawn from the peer-reviewed literature below. Read the primary sources before applying any output to a patient.':
      'A lógica clínica deste aplicativo vem da literatura revisada por pares indicada abaixo. Leia as fontes primárias antes de aplicar qualquer resultado a um paciente.',
    'Read the paper': 'Ler o artigo',
    'Source of the Green / Yellow / Red risk-stratification framework and the management pathway shown in this app.':
      'Fonte do modelo de estratificação de risco verde, amarelo e vermelho e do fluxo de manejo apresentado aqui.',
    'Source of the ventricular index 97th-centile reference curve plotted against your measurements.':
      'Fonte da curva de referência do percentil 97 do índice ventricular traçada com as suas medidas.',
    'This app is an educational and reference tool. It reproduces the published frameworks above for convenience; it does not extend, validate, or substitute for them, and it is not endorsed by their authors.':
      'Este aplicativo é uma ferramenta educacional e de referência. Reproduz os modelos publicados por conveniência; não os amplia, valida nem substitui, e não tem o endosso dos seus autores.',
    'Created by the Sarnat‑NNCC program': 'Criado pelo programa Sarnat‑NNCC',
    'Neonatal Neuro‑Critical Care. Developed by Dr Khorshid Mohammad, staff neonatologist.':
      'Cuidados neurocríticos neonatais. Desenvolvido pelo Dr. Khorshid Mohammad, neonatologista.',
    'e.g. 0.75': 'ex.: 0,75',
    'L': 'E',
    'R': 'D',
  },
};

/** Dynamic strings: the risk "Triggers" lines and the report's PMA cell. */
const patterns: Record<Exclude<Lang, 'en'>, Array<[RegExp, (m: RegExpMatchArray) => string]>> = {
  fr: [
    [/^VI \(([\d.]+)mm\) > 97th% \+ 4mm$/, (m) => `IV (${dec(m[1])} mm) > 97e centile + 4 mm`],
    [/^AHW \(([\d.]+)mm\) > 10mm$/, (m) => `LCA (${dec(m[1])} mm) > 10 mm`],
    [/^TOD \(([\d.]+)mm\) > 25mm$/, (m) => `DTO (${dec(m[1])} mm) > 25 mm`],
    [/^VI \(([\d.]+)mm\) > 97th% AND AHW > 6mm$/, (m) => `IV (${dec(m[1])} mm) > 97e centile ET LCA > 6 mm`],
    [/^([\d.]+) wks$/, (m) => `${dec(m[1])} sem`],
  ],
  es: [
    [/^VI \(([\d.]+)mm\) > 97th% \+ 4mm$/, (m) => `IV (${dec(m[1])} mm) > P97 + 4 mm`],
    [/^AHW \(([\d.]+)mm\) > 10mm$/, (m) => `ACA (${dec(m[1])} mm) > 10 mm`],
    [/^TOD \(([\d.]+)mm\) > 25mm$/, (m) => `DTO (${dec(m[1])} mm) > 25 mm`],
    [/^VI \(([\d.]+)mm\) > 97th% AND AHW > 6mm$/, (m) => `IV (${dec(m[1])} mm) > P97 Y ACA > 6 mm`],
    [/^([\d.]+) wks$/, (m) => `${dec(m[1])} sem`],
  ],
  pt: [
    [/^VI \(([\d.]+)mm\) > 97th% \+ 4mm$/, (m) => `IV (${dec(m[1])} mm) > P97 + 4 mm`],
    [/^AHW \(([\d.]+)mm\) > 10mm$/, (m) => `LCA (${dec(m[1])} mm) > 10 mm`],
    [/^TOD \(([\d.]+)mm\) > 25mm$/, (m) => `DTO (${dec(m[1])} mm) > 25 mm`],
    [/^VI \(([\d.]+)mm\) > 97th% AND AHW > 6mm$/, (m) => `IV (${dec(m[1])} mm) > P97 E LCA > 6 mm`],
    [/^([\d.]+) wks$/, (m) => `${dec(m[1])} sem`],
  ],
};

/** French, Spanish and Portuguese write decimals with a comma. */
function dec(value: string): string {
  return value.replace('.', ',');
}

/**
 * A few sentences are split across elements ("A <b>Sarnat-NNCC</b> program tool").
 * These rules fire only inside the element that owns the whole sentence.
 */
const contextRules: Array<{ text: string; within: string; value: Record<Exclude<Lang, 'en'>, string> }> = [
  { text: 'A', within: 'Sarnat', value: { fr: '', es: '', pt: '' } },
];

const originals = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();
const TRANSLATED_ATTRS = ['placeholder', 'aria-label', 'title'];
let language: Lang = 'en';
const originalTitle = document.title;

function lookup(text: string): string | null {
  if (language === 'en') return null;
  const dict = dictionaries[language];
  if (Object.prototype.hasOwnProperty.call(dict, text)) return dict[text];
  for (const [pattern, build] of patterns[language]) {
    const match = text.match(pattern);
    if (match) return build(match);
  }
  return null;
}

function translate(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const translated = lookup(trimmed);
  return translated === null ? text : text.replace(trimmed, translated);
}

function translateTree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    applyToTextNode(root as Text);
    return;
  }
  if (!(root instanceof Element) && root.nodeType !== Node.DOCUMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach(applyToTextNode);

  const elements: Element[] = root instanceof Element ? [root, ...root.querySelectorAll('*')] : [];
  elements.forEach((element) => {
    TRANSLATED_ATTRS.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const store = attrOriginals.get(element) || {};
      if (!(attribute in store)) {
        store[attribute] = element.getAttribute(attribute) as string;
        attrOriginals.set(element, store);
      }
      const original = store[attribute];
      const next = language === 'en' ? original : translate(original);
      if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
    });
  });
}

function applyToTextNode(node: Text): void {
  const parent = node.parentElement;
  if (parent && parent.closest('script, style, [data-i18n-switcher]')) return;
  if (!originals.has(node)) originals.set(node, node.nodeValue || '');
  const original = originals.get(node) as string;
  let next = language === 'en' ? original : translate(original);
  if (language !== 'en') {
    const trimmed = original.trim();
    const rule = contextRules.find(
      (r) => r.text === trimmed && parent !== null && (parent.textContent || '').includes(r.within),
    );
    if (rule) next = original.replace(trimmed, rule.value[language as Exclude<Lang, 'en'>]);
  }
  if (node.nodeValue !== next) node.nodeValue = next;
}

function storedLanguage(): Lang | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved && SUPPORTED.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

function deviceLanguage(): Lang {
  const preferred = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || 'en'];
  for (const tag of preferred) {
    const code = String(tag).slice(0, 2).toLowerCase() as Lang;
    if (SUPPORTED.includes(code)) return code;
  }
  return 'en';
}

function buildSwitcher(): void {
  const nav = document.createElement('nav');
  nav.setAttribute('data-i18n-switcher', '');
  nav.setAttribute('aria-label', 'Language');
  nav.style.cssText = [
    'position:fixed',
    'top:calc(env(safe-area-inset-top, 0px) + 8px)',
    'right:calc(env(safe-area-inset-right, 0px) + 10px)',
    'z-index:2147483000',
    'display:flex',
    'gap:4px',
    'padding:3px',
    'border-radius:999px',
    'background:rgba(15,23,42,0.88)',
    'box-shadow:0 2px 10px rgba(15,23,42,0.25)',
  ].join(';');

  SUPPORTED.forEach((code) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = code.toUpperCase();
    button.dataset.language = code;
    button.style.cssText = [
      'min-width:34px',
      'height:30px',
      'border:0',
      'border-radius:999px',
      'background:transparent',
      'color:#fff',
      'font:700 11px system-ui, sans-serif',
      'letter-spacing:0.03em',
      'cursor:pointer',
    ].join(';');
    button.addEventListener('click', () => setLanguage(code));
    nav.appendChild(button);
  });

  document.body.appendChild(nav);
}

function paintSwitcher(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-i18n-switcher] button').forEach((button) => {
    const active = button.dataset.language === language;
    button.style.background = active ? '#fff' : 'transparent';
    button.style.color = active ? '#0f172a' : '#fff';
    button.setAttribute('aria-pressed', String(active));
  });
}

export function setLanguage(next: Lang, remember = true): void {
  language = SUPPORTED.includes(next) ? next : 'en';
  if (remember) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* private mode: the choice simply is not remembered */
    }
  }
  document.documentElement.lang = language;
  document.title = language === 'en' ? originalTitle : translate(originalTitle);
  paintSwitcher();
  translateTree(document.body);
}

export function currentLanguage(): Lang {
  return language;
}

const NATIVE_NAMES: Record<Lang, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
};

// A faint mark of the app's own visual language, so the first screen reads as
// this app rather than an anonymous panel.
const WATERMARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"><path d="M24 296C140 268 300 214 456 150" stroke-dasharray="18 22"/><path d="M24 356C140 330 300 278 456 214"/><path d="M24 412C140 388 300 340 456 280" stroke-dasharray="18 22" opacity="0.6"/><g fill="#ffffff" stroke="none"><circle cx="96" cy="336" r="17"/><circle cx="186" cy="316" r="17"/><circle cx="276" cy="288" r="17"/><circle cx="366" cy="252" r="17"/></g></svg>';

// Shown once, before the disclaimer, when no language has been chosen yet.
// The panel carries data-i18n-switcher so the engine leaves its native names alone.
function showLanguageChooser(): void {
  const nav = document.querySelector<HTMLElement>('[data-i18n-switcher]');
  if (nav) nav.style.display = 'none';

  const overlay = document.createElement('div');
  overlay.setAttribute('data-i18n-switcher', '');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Language');
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483600',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:24px',
    'padding-top:calc(env(safe-area-inset-top, 0px) + 24px)',
    'padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 24px)',
    'overflow:hidden',
    'background:linear-gradient(165deg, #0b1220 0%, #15254c 55%, #0d1730 100%)',
    'font:400 15px system-ui, -apple-system, Segoe UI, sans-serif',
  ].join(';');

  const mark = document.createElement('div');
  mark.setAttribute('aria-hidden', 'true');
  mark.style.cssText = [
    'position:absolute',
    'left:0',
    'right:0',
    'top:0',
    'height:44%',
    'pointer-events:none',
    'background-repeat:no-repeat',
    'background-position:center bottom',
    'background-size:contain',
    'opacity:0.26',
    'background-image:url("data:image/svg+xml,' + encodeURIComponent(WATERMARK) + '")',
  ].join(';');
  overlay.appendChild(mark);

  const card = document.createElement('div');
  card.style.cssText = [
    'position:relative',
    'margin-top:14vh',
    'width:100%',
    'max-width:320px',
    'display:flex',
    'flex-direction:column',
    'gap:10px',
  ].join(';');

  const heading = document.createElement('p');
  heading.textContent = 'Language';
  heading.style.cssText = [
    'margin:0 0 2px',
    'color:#e2e8f0',
    'font:600 13px system-ui, -apple-system, Segoe UI, sans-serif',
    'letter-spacing:0.08em',
    'text-transform:uppercase',
    'text-align:center',
  ].join(';');
  card.appendChild(heading);

  const subheading = document.createElement('p');
  subheading.textContent = 'Choisissez votre langue / Elija su idioma / Escolha o seu idioma';
  subheading.style.cssText = [
    'margin:0 0 10px',
    'color:#94a3b8',
    'font:400 12px system-ui, -apple-system, Segoe UI, sans-serif',
    'line-height:1.5',
    'text-align:center',
  ].join(';');
  card.appendChild(subheading);

  SUPPORTED.forEach((code) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = NATIVE_NAMES[code];
    button.style.cssText = [
      'width:100%',
      'min-height:52px',
      'border:0',
      'border-radius:14px',
      'background:#ffffff',
      'color:#0f172a',
      'font:600 16px system-ui, -apple-system, Segoe UI, sans-serif',
      'box-shadow:0 6px 18px rgba(2,6,23,0.28)',
      'cursor:pointer',
    ].join(';');
    button.addEventListener('click', () => {
      setLanguage(code);
      overlay.remove();
      document.documentElement.style.overflow = previousOverflow;
      if (nav) nav.style.display = '';
    });
    card.appendChild(button);
  });

  overlay.appendChild(card);
  const previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  document.body.appendChild(overlay);
}

function start(): void {
  buildSwitcher();

  new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE || node instanceof Element) translateTree(node);
      });
      if (record.type === 'characterData' && record.target.nodeType === Node.TEXT_NODE) {
        const node = record.target as Text;
        const value = node.nodeValue || '';
        if (originals.get(node) !== value && lookup(value.trim()) !== null) {
          originals.set(node, value);
          applyToTextNode(node);
        }
      }
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  // alert() text never reaches the DOM, so translate it at the call site.
  const nativeAlert = window.alert.bind(window);
  window.alert = (message?: unknown) => nativeAlert(translate(String(message ?? '')));

  const saved = storedLanguage();
  if (saved) {
    setLanguage(saved);
    return;
  }
  // No choice on record: pre-select the device language, then let the clinician
  // confirm it before the disclaimer is shown.
  setLanguage(deviceLanguage(), false);
  showLanguageChooser();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
