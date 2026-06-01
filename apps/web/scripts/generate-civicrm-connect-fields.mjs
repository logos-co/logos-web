/**
 * Generates CiviCRM field mapping and option fallbacks for connect forms.
 * Writes lib/civicrm/connect-fallbacks.json (used by fetch-afform-contact-form.mjs).
 *
 * Run: pnpm generate:civicrm-fields
 * Requires CIVICRM_BASE_URL + CIVICRM_API_KEY in apps/civi-crm/.env.local or apps/web/.env.local
 */

import dotenv from "dotenv";
import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const civiCrmRoot = path.resolve(root, "..", "civi-crm");

for (const envPath of [
  path.join(civiCrmRoot, ".env.local"),
  path.join(civiCrmRoot, ".env"),
  path.join(root, ".env.local"),
  path.join(root, ".env"),
]) {
  dotenv.config({ path: envPath });
}

const CIVICRM_BASE_URL = process.env.CIVICRM_BASE_URL?.replace(/\/$/, "");
const CIVICRM_API_KEY = process.env.CIVICRM_API_KEY;

if (!CIVICRM_BASE_URL || !CIVICRM_API_KEY) {
  console.error(
    "Missing CIVICRM_BASE_URL or CIVICRM_API_KEY. Add them to .env.local and run again."
  );
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${CIVICRM_API_KEY}`,
  "X-Requested-With": "XMLHttpRequest",
};

async function civicrmApi(entity, action, body = {}) {
  const res = await fetch(
    `${CIVICRM_BASE_URL}/civicrm/ajax/api4/${entity}/${action}`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    throw new Error(`${entity}/${action}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Form field key → CiviCRM identifier.
 * individualField: exact name from Contact.getFields (e.g. Contacts_Custom_Fields.Role or nick_name).
 * customGroupName + customFieldLabel: used to resolve option_group_id and options (optional).
 */
const SEED_MAP = [
  {
    formKey: "role",
    individualField: "Contacts_Custom_Fields.Role",
    customGroupName: "Contacts_Custom_Fields",
    customFieldLabel: "Role",
    dataType: "String",
  },
  {
    formKey: "name",
    individualField: "nick_name",
    dataType: "String",
  },
  {
    formKey: "skills",
    individualField: "Skills_Socials.Skills_Experience",
    customGroupName: "Skills_Socials",
    customFieldLabel: "Skills_Experience",
    dataType: "String",
  },
  {
    formKey: "city",
    individualField: "primary_address_id.city",
    dataType: "String",
  },
  {
    formKey: "affiliatedOrgs",
    individualField: "Contacts_Custom_Fields.Affiliated_Organizations",
    customGroupName: "Contacts_Custom_Fields",
    customFieldLabel: "Affiliated Organizations",
    dataType: "String",
  },
  {
    formKey: "email",
    individualField: "email_primary.email",
    dataType: "String",
  },
  {
    formKey: "website",
    individualField: "website_primary.url",
    dataType: "String",
  },
  {
    formKey: "chat",
    individualField: "Contacts_Custom_Fields.Chat_Handle",
    customGroupName: "Contacts_Custom_Fields",
    customFieldLabel: "Chat Handle",
    dataType: "String",
  },
  {
    formKey: "socials",
    individualField: "Contacts_Custom_Fields.Socials",
    customGroupName: "Contacts_Custom_Fields",
    customFieldLabel: "Socials",
    dataType: "String",
  },
];

/** Read CIVICRM_AFFORM_OPTIONS from the afform constants file so connect-fields stays in sync (role, skills, chatService). */
async function readAfformOptions(jsPath) {
  try {
    const content = await fs.readFile(jsPath, "utf8");
    const marker = "export const AFFORM_OPTIONS = ";
    const idx = content.indexOf(marker);
    if (idx === -1) return null;
    const start = content.indexOf("{", idx + marker.length);
    if (start === -1) return null;
    let depth = 0;
    let end = -1;
    for (let i = start; i < content.length; i++) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end === -1) return null;
    const parsed = JSON.parse(content.slice(start, end));
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.role) && Array.isArray(parsed.skills) && Array.isArray(parsed.chatService)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function normOptionGroupId(id) {
  if (id == null) return null;
  return Number(typeof id === "object" && id?.id != null ? id.id : id);
}

async function main() {
  console.log("Fetching Contact.getFields (Individual)...");
  const fieldsRes = await civicrmApi("Contact", "getFields", {
    action: "create",
    values: { contact_type: "Individual" },
    select: [
      "name",
      "label",
      "title",
      "custom_field_id",
      "data_type",
      "input_type",
      "options",
    ],
  });
  const fields = fieldsRes.values || [];
  const fieldsWithCustom = fields.filter((f) => f.custom_field_id != null);
  console.log(`  Got ${fields.length} fields, ${fieldsWithCustom.length} with custom_field_id`);

  console.log("Fetching CustomField.get (Individual + Contact, all)...");
  const customRes = await civicrmApi("CustomField", "get", {
    select: [
      "id",
      "name",
      "label",
      "custom_group_id",
      "custom_group_id.name",
      "custom_group_id.title",
      "option_group_id",
      "option_group_id.name",
    ],
    where: [
      ["custom_group_id.extends", "IN", ["Individual", "Contact"]],
    ],
  });
  const customFields = customRes.values || [];
  console.log(`  Got ${customFields.length} custom fields`);
  if (customFields.length > 0) {
    const withOpts = customFields.filter((cf) => cf.option_group_id != null);
    console.log(`  ${withOpts.length} have option_group_id. Sample: ${JSON.stringify(customFields.slice(0, 2).map((c) => ({ id: c.id, name: c.name, "group.name": c["custom_group_id.name"], label: c.label, option_group_id: c.option_group_id })))}`);
  }

  console.log("Fetching OptionValue.get (all active)...");
  const optionRes = await civicrmApi("OptionValue", "get", {
    select: ["option_group_id", "value", "label", "name", "weight"],
    where: [["is_active", "=", true]],
    orderBy: { option_group_id: "ASC", weight: "ASC" },
    limit: 0,
  });
  const optionValues = optionRes.values || [];

  const optionsByGroupId = {};
  for (const ov of optionValues) {
    const gid = normOptionGroupId(ov.option_group_id);
    if (gid == null) continue;
    if (!optionsByGroupId[gid]) optionsByGroupId[gid] = [];
    optionsByGroupId[gid].push({
      value: String(ov.value),
      label: ov.label || ov.name || String(ov.value),
      name: ov.name,
    });
  }

  // Chat Service (IM provider_id): try multiple option group names, prefer group that has Farcaster/X
  const chatServiceCandidateIds = [];
  for (const ogName of ["instant_messenger_service", "instant_messenger_type"]) {
    try {
      const ogRes = await civicrmApi("OptionGroup", "get", {
        select: ["id"],
        where: [["name", "=", ogName]],
      });
      for (const row of ogRes.values || []) {
        const id = normOptionGroupId(row.id);
        if (id != null && !chatServiceCandidateIds.includes(id)) chatServiceCandidateIds.push(id);
      }
      if (chatServiceCandidateIds.length > 0) break;
    } catch {
      // try next name
    }
  }
  const hasImProviderOptions = (arr) =>
    arr?.length &&
    arr.some((o) => {
      const t = `${(o.label || "")} ${(o.name || "")}`.toLowerCase();
      return /farcaster/.test(t) || /\bx\b/.test(t);
    });
  let chatServiceOptionGroupId = null;
  for (const cId of chatServiceCandidateIds) {
    const arr = optionsByGroupId[normOptionGroupId(cId)];
    if (arr?.length > 0 && arr.length <= 50 && hasImProviderOptions(arr)) {
      chatServiceOptionGroupId = cId;
      break;
    }
  }
  if (chatServiceOptionGroupId == null && chatServiceCandidateIds.length > 0) {
    chatServiceOptionGroupId = chatServiceCandidateIds[0];
  }

  const customById = new Map(customFields.map((cf) => [cf.id, cf]));
  const customByKey = new Map();
  for (const cf of customFields) {
    const groupName = cf["custom_group_id.name"] ?? cf["custom_group_id"]?.name ?? "";
    customByKey.set(`${groupName}.${cf.name}`, cf);
    if (cf.label) {
      customByKey.set(`${groupName}.${cf.label.replace(/\s+/g, "_")}`, cf);
      customByKey.set(`${groupName}.${cf.label}`, cf);
    }
  }
  const byIndividualFieldName = new Map(fields.map((f) => [f.name, f]));
  for (const cf of customFields) {
    const groupName = cf["custom_group_id.name"] ?? cf["custom_group_id"]?.name ?? "";
    const key1 = `${groupName}.${cf.name}`;
    if (!byIndividualFieldName.has(key1)) byIndividualFieldName.set(key1, { name: key1, custom_field_id: cf.id });
    if (cf.label) {
      const key2 = `${groupName}.${cf.label.replace(/\s+/g, "_")}`;
      if (!byIndividualFieldName.has(key2)) byIndividualFieldName.set(key2, { name: key2, custom_field_id: cf.id });
    }
  }

  const fieldConfig = [];
  const optionsExport = {};

  for (const seed of SEED_MAP) {
    const { formKey, individualField, customGroupName, customFieldLabel, dataType } = seed;

    let customField = null;
    const contactField = byIndividualFieldName.get(individualField);
    if (contactField?.custom_field_id) {
      customField = customById.get(contactField.custom_field_id) ?? null;
    }
    if (!customField && (customGroupName || customFieldLabel)) {
      const customKey = customGroupName && customFieldLabel
        ? `${customGroupName}.${customFieldLabel.replace(/\s+/g, "_")}`
        : null;
      const altKey = customGroupName && customFieldLabel
        ? `${customGroupName}.${customFieldLabel}`
        : null;
      customField = (customKey && customByKey.get(customKey)) || (altKey && customByKey.get(altKey)) || null;
    }
    if (!customField && (customGroupName || customFieldLabel)) {
      customField = customFields.find(
        (cf) =>
          (cf["custom_group_id.name"] === customGroupName || cf["custom_group_id.title"] === customGroupName?.replace(/_/g, " ")) &&
          (cf.label === customFieldLabel || cf.name === customFieldLabel || cf.name === customFieldLabel?.replace(/\s+/g, "_"))
      ) ?? null;
    }

    const optionGroupId = customField?.option_group_id ?? null;
    const options = optionGroupId ? optionsByGroupId[normOptionGroupId(optionGroupId)] ?? [] : null;

    fieldConfig.push({
      formKey,
      individualField,
      customFieldId: customField?.id ?? null,
      optionGroupId,
      dataType: dataType || "String",
      options: options,
    });

    if (options && options.length) {
      optionsExport[formKey] = options;
    }
  }

  const chatServiceOpts =
    chatServiceOptionGroupId != null
      ? optionsByGroupId[normOptionGroupId(chatServiceOptionGroupId)] ?? []
      : [];
  if (chatServiceOpts.length) {
    optionsExport.chatService = chatServiceOpts;
    console.log(`  chatService: ${chatServiceOpts.length} options from instant_messenger_service`);
  } else {
    optionsExport.chatService = [
      { value: "1", label: "Farcaster", name: "Farcaster" },
      { value: "2", label: "Signal", name: "Signal" },
      { value: "3", label: "GitHub", name: "GitHub" },
      { value: "4", label: "Discord", name: "Discord" },
      { value: "5", label: "Other", name: "Other" },
    ];
    console.log("  chatService: using fallback list (run with API to pull from instant_messenger_service)");
  }

  // Prefer role, skills, chatService from the contact afform config when present
  const afformPath = path.join(root, "lib", "civicrm", "afform-circle-contact-form.ts");
  const afformOptions = await readAfformOptions(afformPath);
  if (afformOptions) {
    if (afformOptions.role?.length) optionsExport.role = afformOptions.role;
    if (afformOptions.skills?.length) optionsExport.skills = afformOptions.skills;
    if (afformOptions.chatService?.length) optionsExport.chatService = afformOptions.chatService;
    console.log("  Synced role/skills/chatService from afform-circle-contact-form.ts");
  }

  const optionGroupIds = {};
  for (const entry of fieldConfig) {
    if (entry.optionGroupId != null && entry.formKey) {
      optionGroupIds[entry.formKey] = entry.optionGroupId;
    }
  }

  const outPath = path.join(root, "lib", "civicrm", "connect-fallbacks.json");
  const payload = {
    optionGroupIds,
    options: optionsExport,
    fieldConfig,
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
