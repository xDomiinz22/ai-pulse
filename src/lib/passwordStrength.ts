import { ZxcvbnFactory } from '@zxcvbn-ts/core'
import * as common from '@zxcvbn-ts/language-common'
import * as en from '@zxcvbn-ts/language-en'

// Configure zxcvbn once with the English + common dictionaries.
const zxcvbn = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...en.dictionary },
  graphs: common.adjacencyGraphs,
  translations: en.translations,
})

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4   // 0 = very weak … 4 = strong
  label: string
  hint: string               // first warning/suggestion from zxcvbn, if any
}

const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']

export function checkPassword(password: string): Strength {
  if (!password) return { score: 0, label: '', hint: '' }
  const r = zxcvbn.check(password)
  const score = r.score as Strength['score']
  return {
    score,
    label: LABELS[score],
    hint: r.feedback.warning || r.feedback.suggestions[0] || '',
  }
}

// Minimum score required to create an account ("Fair" or better).
export const MIN_PASSWORD_SCORE = 2
