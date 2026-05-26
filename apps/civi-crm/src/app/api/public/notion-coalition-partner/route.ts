import { type NextRequest, NextResponse } from 'next/server'

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN ?? ''
const NOTION_COALITION_PARTNER_DB_ID =
  process.env.NOTION_COALITION_PARTNER_DB_ID ?? ''
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET ?? ''

const SKILLS_MAP: Record<string, string> = {
  '1': 'Developer',
  '2': 'Web3 builder',
  '3': 'Privacy domain expert',
  '4': 'Website developer',
  '5': 'Product designer',
  '6': 'Researcher',
  '7': 'Activist',
  '8': 'Project manager',
  '9': 'Community builder',
  '10': 'Thought leader / Influencer',
  '11': 'Creative',
  '12': 'Marketer',
  '13': 'Fundraiser',
  '14': 'Educator',
  '15': 'Policy advocate',
  '16': 'Translator',
}

const CHAT_SERVICE_MAP: Record<string, string> = {
  '1': 'Discord',
  '2': 'Telegram',
  '3': 'X',
  '4': 'Farcaster',
  '5': 'Signal',
  '6': 'GitHub',
  '7': 'Status App',
  '8': 'WhatsApp',
  '9': 'Other',
}

const COUNTRY_MAP: Record<string, string> = {
  '1001': 'Afghanistan',
  '1002': 'Albania',
  '1003': 'Algeria',
  '1004': 'American Samoa',
  '1005': 'Andorra',
  '1006': 'Angola',
  '1007': 'Anguilla',
  '1008': 'Antarctica',
  '1009': 'Antigua and Barbuda',
  '1010': 'Argentina',
  '1011': 'Armenia',
  '1012': 'Aruba',
  '1013': 'Australia',
  '1014': 'Austria',
  '1015': 'Azerbaijan',
  '1016': 'Bahrain',
  '1017': 'Bangladesh',
  '1018': 'Barbados',
  '1019': 'Belarus',
  '1020': 'Belgium',
  '1021': 'Belize',
  '1022': 'Benin',
  '1023': 'Bermuda',
  '1024': 'Bhutan',
  '1025': 'Bolivia',
  '1026': 'Bosnia and Herzegovina',
  '1027': 'Botswana',
  '1028': 'Bouvet Island',
  '1029': 'Brazil',
  '1030': 'British Indian Ocean Territory',
  '1031': 'Virgin Islands, British',
  '1032': 'Brunei Darussalam',
  '1033': 'Bulgaria',
  '1034': 'Burkina Faso',
  '1035': 'Myanmar',
  '1036': 'Burundi',
  '1037': 'Cambodia',
  '1038': 'Cameroon',
  '1039': 'Canada',
  '1040': 'Cape Verde',
  '1041': 'Cayman Islands',
  '1042': 'Central African Republic',
  '1043': 'Chad',
  '1044': 'Chile',
  '1045': 'China',
  '1046': 'Christmas Island',
  '1047': 'Cocos (Keeling) Islands',
  '1048': 'Colombia',
  '1049': 'Comoros',
  '1050': 'Congo, The Democratic Republic of the',
  '1051': 'Congo, Republic of the',
  '1052': 'Cook Islands',
  '1053': 'Costa Rica',
  '1054': "Côte d'Ivoire",
  '1055': 'Croatia',
  '1056': 'Cuba',
  '1057': 'Cyprus',
  '1058': 'Czech Republic',
  '1059': 'Denmark',
  '1060': 'Djibouti',
  '1061': 'Dominica',
  '1062': 'Dominican Republic',
  '1063': 'Timor-Leste',
  '1064': 'Ecuador',
  '1065': 'Egypt',
  '1066': 'El Salvador',
  '1067': 'Equatorial Guinea',
  '1068': 'Eritrea',
  '1069': 'Estonia',
  '1070': 'Ethiopia',
  '1072': 'Falkland Islands (Malvinas)',
  '1073': 'Faroe Islands',
  '1074': 'Fiji',
  '1075': 'Finland',
  '1076': 'France',
  '1077': 'French Guiana',
  '1078': 'French Polynesia',
  '1079': 'French Southern Territories',
  '1080': 'Gabon',
  '1081': 'Georgia',
  '1082': 'Germany',
  '1083': 'Ghana',
  '1084': 'Gibraltar',
  '1085': 'Greece',
  '1086': 'Greenland',
  '1087': 'Grenada',
  '1088': 'Guadeloupe',
  '1089': 'Guam',
  '1090': 'Guatemala',
  '1091': 'Guinea',
  '1092': 'Guinea-Bissau',
  '1093': 'Guyana',
  '1094': 'Haiti',
  '1095': 'Heard Island and McDonald Islands',
  '1096': 'Holy See (Vatican City State)',
  '1097': 'Honduras',
  '1098': 'Hong Kong',
  '1099': 'Hungary',
  '1100': 'Iceland',
  '1101': 'India',
  '1102': 'Indonesia',
  '1103': 'Iran, Islamic Republic of',
  '1104': 'Iraq',
  '1105': 'Ireland',
  '1106': 'Israel',
  '1107': 'Italy',
  '1108': 'Jamaica',
  '1109': 'Japan',
  '1110': 'Jordan',
  '1111': 'Kazakhstan',
  '1112': 'Kenya',
  '1113': 'Kiribati',
  '1114': "Korea, Democratic People's Republic of",
  '1115': 'Korea, Republic of',
  '1116': 'Kuwait',
  '1117': 'Kyrgyzstan',
  '1118': "Lao People's Democratic Republic",
  '1119': 'Latvia',
  '1120': 'Lebanon',
  '1121': 'Lesotho',
  '1122': 'Liberia',
  '1123': 'Libya',
  '1124': 'Liechtenstein',
  '1125': 'Lithuania',
  '1126': 'Luxembourg',
  '1127': 'Macao',
  '1128': 'North Macedonia',
  '1129': 'Madagascar',
  '1130': 'Malawi',
  '1131': 'Malaysia',
  '1132': 'Maldives',
  '1133': 'Mali',
  '1134': 'Malta',
  '1135': 'Marshall Islands',
  '1136': 'Martinique',
  '1137': 'Mauritania',
  '1138': 'Mauritius',
  '1139': 'Mayotte',
  '1140': 'Mexico',
  '1141': 'Micronesia, Federated States of',
  '1142': 'Moldova',
  '1143': 'Monaco',
  '1144': 'Mongolia',
  '1145': 'Montserrat',
  '1146': 'Morocco',
  '1147': 'Mozambique',
  '1148': 'Namibia',
  '1149': 'Nauru',
  '1150': 'Nepal',
  '1152': 'Netherlands',
  '1153': 'New Caledonia',
  '1154': 'New Zealand',
  '1155': 'Nicaragua',
  '1156': 'Niger',
  '1157': 'Nigeria',
  '1158': 'Niue',
  '1159': 'Norfolk Island',
  '1160': 'Northern Mariana Islands',
  '1161': 'Norway',
  '1162': 'Oman',
  '1163': 'Pakistan',
  '1164': 'Palau',
  '1165': 'Palestine, State of',
  '1166': 'Panama',
  '1167': 'Papua New Guinea',
  '1168': 'Paraguay',
  '1169': 'Peru',
  '1170': 'Philippines',
  '1171': 'Pitcairn',
  '1172': 'Poland',
  '1173': 'Portugal',
  '1174': 'Puerto Rico',
  '1175': 'Qatar',
  '1176': 'Romania',
  '1177': 'Russian Federation',
  '1178': 'Rwanda',
  '1179': 'Reunion',
  '1180': 'Saint Helena',
  '1181': 'Saint Kitts and Nevis',
  '1182': 'Saint Lucia',
  '1183': 'Saint Pierre and Miquelon',
  '1184': 'Saint Vincent and the Grenadines',
  '1185': 'Samoa',
  '1186': 'San Marino',
  '1187': 'Saudi Arabia',
  '1188': 'Senegal',
  '1189': 'Seychelles',
  '1190': 'Sierra Leone',
  '1191': 'Singapore',
  '1192': 'Slovakia',
  '1193': 'Slovenia',
  '1194': 'Solomon Islands',
  '1195': 'Somalia',
  '1196': 'South Africa',
  '1197': 'South Georgia and the South Sandwich Islands',
  '1198': 'Spain',
  '1199': 'Sri Lanka',
  '1200': 'Sudan',
  '1201': 'Suriname',
  '1202': 'Svalbard and Jan Mayen',
  '1203': 'Eswatini',
  '1204': 'Sweden',
  '1205': 'Switzerland',
  '1206': 'Syrian Arab Republic',
  '1207': 'Sao Tome and Principe',
  '1208': 'Taiwan',
  '1209': 'Tajikistan',
  '1210': 'Tanzania, United Republic of',
  '1211': 'Thailand',
  '1212': 'Bahamas',
  '1213': 'Gambia',
  '1214': 'Togo',
  '1215': 'Tokelau',
  '1216': 'Tonga',
  '1217': 'Trinidad and Tobago',
  '1218': 'Tunisia',
  '1219': 'Turkey',
  '1220': 'Turkmenistan',
  '1221': 'Turks and Caicos Islands',
  '1222': 'Tuvalu',
  '1223': 'Uganda',
  '1224': 'Ukraine',
  '1225': 'United Arab Emirates',
  '1226': 'United Kingdom',
  '1227': 'United States Minor Outlying Islands',
  '1228': 'United States',
  '1229': 'Uruguay',
  '1230': 'Uzbekistan',
  '1231': 'Vanuatu',
  '1232': 'Venezuela',
  '1233': 'Viet Nam',
  '1234': 'Virgin Islands, U.S.',
  '1235': 'Wallis and Futuna',
  '1236': 'Western Sahara',
  '1237': 'Yemen',
  '1239': 'Zambia',
  '1240': 'Zimbabwe',
  '1241': 'Åland Islands',
  '1242': 'Serbia',
  '1243': 'Montenegro',
  '1244': 'Jersey',
  '1245': 'Guernsey',
  '1246': 'Isle of Man',
  '1247': 'South Sudan',
  '1248': 'Curaçao',
  '1249': 'Sint Maarten (Dutch Part)',
  '1250': 'Bonaire, Saint Eustatius and Saba',
  '1251': 'Kosovo',
  '1252': 'Saint Barthélemy',
  '1253': 'Saint Martin (French part)',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

async function verifyHCaptcha(
  token: string,
  remoteip: string
): Promise<boolean> {
  const res = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: HCAPTCHA_SECRET,
      response: token,
      remoteip,
    }),
  })
  const json = await res.json()
  return json.success === true
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

function toArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []
}

function trim(s: unknown): string {
  return s && typeof s === 'string' ? s.trim() : ''
}

function richText(content: string) {
  return {
    rich_text: [{ type: 'text', text: { content: content.slice(0, 2000) } }],
  }
}

function buildNotionProperties(data: Record<string, unknown>) {
  const name = trim(data.name) || 'Unknown'
  const email = trim(data.email)
  const city = trim(data.city)
  const countryId = trim(data.country)
  const country = COUNTRY_MAP[countryId] ?? countryId

  const affiliatedOrgs = trim(data.affiliatedOrgs)
  const backgroundPartner = trim(data.backgroundPartner)
  const questions = trim(data.questions)
  const wantsEvents = data.wantsEvents === true
  const wantsNewsletter = data.wantsNewsletter === true

  const skillIds = toArray(data.skills)
  const skillNames = skillIds
    .map((id) => SKILLS_MAP[id] ?? id)
    .filter(Boolean)
    .map((skillName) => ({ name: skillName }))

  const websiteArr = toArray(data.website).map(trim).filter(Boolean)
  const websitesStr = websiteArr.join(' | ')

  const chatArr = toArray(data.chat).map(trim)
  const chatServiceArr = toArray(data.chatService).map(trim)
  const chatPairs = chatArr
    .map((handle, i): string | null => {
      if (!handle) return null
      const svcId = chatServiceArr[i] ?? ''
      const svcLabel = CHAT_SERVICE_MAP[svcId] ?? svcId
      return svcLabel ? `${handle} (${svcLabel})` : handle
    })
    .filter((v): v is string => v !== null)
  const chatStr = chatPairs.join(' | ')

  return {
    Name: { title: [{ type: 'text', text: { content: name } }] },
    ...(email ? { Email: { email } } : {}),
    City: richText(city),
    Country: richText(country),
    'Affiliated Organisations': richText(affiliatedOrgs),
    Skills: { multi_select: skillNames },
    Websites: richText(websitesStr),
    'Chat Handles': richText(chatStr),
    'About Organisation': richText(backgroundPartner),
    Questions: richText(questions),
    'Wants Events': { checkbox: wantsEvents },
    'Wants Newsletter': { checkbox: wantsNewsletter },
    'Submitted At': { date: { start: new Date().toISOString() } },
  }
}

export async function POST(req: NextRequest) {
  if (!NOTION_API_TOKEN || !NOTION_COALITION_PARTNER_DB_ID) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const {
    captchaToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fields: _fields,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formName: _formName,
    ...formData
  } = body as {
    captchaToken?: string
    fields?: unknown
    formName?: string
    [key: string]: unknown
  }

  if (HCAPTCHA_SECRET) {
    if (!captchaToken || typeof captchaToken !== 'string') {
      return NextResponse.json(
        { error: 'Captcha token missing' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    const valid = await verifyHCaptcha(captchaToken, getClientIp(req))
    if (!valid) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 403, headers: CORS_HEADERS }
      )
    }
  }

  try {
    const properties = buildNotionProperties(formData)

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_COALITION_PARTNER_DB_ID },
        properties,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Notion API (${res.status}): ${text.slice(0, 200)}`)
    }

    return NextResponse.json(
      { success: true },
      { status: 201, headers: CORS_HEADERS }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to submit form. Please try again.', detail: message },
      { status: 502, headers: CORS_HEADERS }
    )
  }
}
