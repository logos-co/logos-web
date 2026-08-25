/**
 * Activist Leader / Steward funnel form definition.
 *
 * Originally generated from the CiviCRM Afform of the same name; CiviCRM is
 * gone, so this file is now maintained by hand. Fields describe rendering only:
 * which ones are required lives in `REQUIRED_FIELDS_BY_FORM` (`@repo/funnel`),
 * and the select options in `./afform-options`.
 */

import type { AfformConfig } from './types'

export const AFFORM_NAME = 'afformActivistLeaderSteward'

export const AFFORM: AfformConfig = {
  confirmationMessage: "Thank you for registering, we'll be in touch soon.",
  fields: [
    {
      formKey: 'name',
      label: 'Nickname/Name',
      inputType: 'text',
    },
    {
      formKey: 'city',
      label: 'city',
      inputType: 'text',
    },
    {
      formKey: 'country',
      label: 'Country',
      inputType: 'select',
    },
    {
      formKey: 'skills',
      label: 'Skills/Experience',
      inputType: 'select',
    },
    {
      formKey: 'email',
      label: 'email',
      inputType: 'email',
    },
    {
      formKey: 'affiliatedOrgs',
      label: 'Affiliated Organisations',
      inputType: 'text',
    },
    {
      formKey: 'website',
      label: 'Website or Socials',
      inputType: 'text',
      repeatable: true,
    },
    {
      formKey: 'chat',
      label: 'Chat Name',
      inputType: 'text',
      repeatable: true,
    },
    {
      formKey: 'chatService',
      label: 'Chat Service',
      inputType: 'select',
      repeatable: true,
    },
    {
      formKey: 'backgroundLeader',
      label:
        "Tell us a bit about your background, what kind of community or local issue you'd want to organise around, any experience you have bringing people together, and why you feel ready to help lead a Circle.",
      inputType: 'textarea',
    },
    {
      formKey: 'activitiesVision',
      label:
        'What types of organised activities do you envision doing to impact your community?',
      inputType: 'textarea',
    },
    {
      formKey: 'questions',
      label:
        'What else would you like us to know? What questions do you have for us?',
      inputType: 'textarea',
    },
    {
      formKey: 'wantsEvents',
      label: 'I want to be informed about events in my city',
      inputType: 'checkbox',
    },
    {
      formKey: 'wantsNewsletter',
      label: 'I want to receive the Logos Newsletter',
      inputType: 'checkbox',
    },
  ],
}
