// Framer Code Component — Ajax Newsletter HubSpot Form (Branded Embed)
// Portal ID: 23114530 | Form ID: 24764996-104b-438d-aa42-6eb99ac99572
//
// Uses HubSpot's developer embed + CSS var injection (same approach as
// Solius BrandedHubSpotForm). Styling mirrors the Ajax lead form:
// transparent border inputs, white bg, purple pill button, inherit font.

import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef } from "react"

export default function AjaxNewsletterHubSpotForm({
    portalId,
    formId,
    region,
}) {
    const containerRef = useRef(null)

    useEffect(() => {
        if (!portalId || !formId || !region) return

        const script = document.createElement("script")
        script.src = `https://js-${region}.hsforms.net/forms/embed/developer/${portalId}.js`
        script.defer = true

        document.body.appendChild(script)

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script)
            }
        }
    }, [portalId, formId, region])

    return (
        <div style={{ width: "100%" }}>
            <style>{`
/*
  All values mirror framer-components/AjaxHubSpotFormV2.tsx design tokens:
    LABEL_COLOR        = #010E2E
    INPUT_BG           = #ffffff
    INPUT_BORDER       = rgba(0,0,0,0.2)
    INPUT_FOCUS_BORDER = #3804E6
    INPUT_RADIUS       = 8
    FONT_SIZE          = 16
    INPUT_COLOR        = #010E2E
    PLACEHOLDER_COLOR  = rgba(0,0,0,0.5)
    BUTTON_COLOR       = #3804E6
    BUTTON_HOVER_COLOR = #2D08FF
    BUTTON_RADIUS      = 48
    FIELD_GAP          = 24 (between fields)
    LABEL_INPUT_GAP    = 12 (between label and input)
*/

:root {
  /* Global */
  --hsf-global__font-family: 'Inter', sans-serif;
  --hsf-global__font-size: 16px;
  --hsf-global__color: #010E2E;
  --hsf-global-error__color: #e74c3c;

  /* Row Spacing — module spacing bumped to match row gap so the
     button-to-last-field gap matches the field-to-field gap. */
  --hsf-row__horizontal-spacing: 16px;
  --hsf-row__vertical-spacing: 24px;
  --hsf-module__vertical-spacing: 24px;

  /* Button */
  --hsf-button__font-family: 'Inter', sans-serif;
  --hsf-button__font-size: 16px;
  --hsf-button__color: #ffffff;
  --hsf-button__background-color: #3804E6;
  --hsf-button__background-image: none;
  --hsf-button__border-radius: 48px;
  --hsf-button__padding: 12px 24px;
  --hsf-button__box-shadow: none;

  /* Rich Text */
  --hsf-richtext__font-family: 'Inter', sans-serif;
  --hsf-richtext__font-size: 16px;
  --hsf-richtext__color: #010E2E;

  /* Heading */
  --hsf-heading__font-family: 'Inter', sans-serif;
  --hsf-heading__color: #010E2E;
  --hsf-heading__text-shadow: none;

  /* Background */
  --hsf-background__background-color: transparent;
  --hsf-background__background-image: none;
  --hsf-background__border-style: none;
  --hsf-background__border-color: transparent;
  --hsf-background__border-radius: 0px;
  --hsf-background__border-width: 0px;
  --hsf-background__padding: 0px;

  /* Error Alert */
  --hsf-erroralert__font-family: 'Inter', sans-serif;
  --hsf-erroralert__font-size: 13px;
  --hsf-erroralert__color: #e74c3c;

  /* Info Alert */
  --hsf-infoalert__font-family: 'Inter', sans-serif;
  --hsf-infoalert__font-size: 14px;
  --hsf-infoalert__color: rgba(1, 14, 46, 0.7);

  /* Field Label */
  --hsf-field-label__font-family: 'Inter', sans-serif;
  --hsf-field-label__font-size: 16px;
  --hsf-field-label__color: #010E2E;
  --hsf-field-label-requiredindicator__color: #e74c3c;
  --hsf-field-description__font-family: 'Inter', sans-serif;
  --hsf-field-description__color: rgba(1, 14, 46, 0.7);
  --hsf-field-footer__font-family: 'Inter', sans-serif;
  --hsf-field-footer__color: rgba(1, 14, 46, 0.7);

  /* Field Input */
  --hsf-field-input__font-family: 'Inter', sans-serif;
  --hsf-field-input__color: #010E2E;
  --hsf-field-input__background-color: #ffffff;
  --hsf-field-input__placeholder-color: rgba(0, 0, 0, 0.5);
  --hsf-field-input__border-color: rgba(0, 0, 0, 0.2);
  --hsf-field-input__border-width: 1px;
  --hsf-field-input__border-style: solid;
  --hsf-field-input__border-radius: 8px;
  --hsf-field-input__padding: 12px 16px;

  /* Field Textarea */
  --hsf-field-textarea__font-family: 'Inter', sans-serif;
  --hsf-field-textarea__color: #010E2E;
  --hsf-field-textarea__background-color: #ffffff;
  --hsf-field-textarea__placeholder-color: rgba(0, 0, 0, 0.5);
  --hsf-field-textarea__border-color: rgba(0, 0, 0, 0.2);
  --hsf-field-textarea__border-width: 1px;
  --hsf-field-textarea__border-style: solid;
  --hsf-field-textarea__border-radius: 8px;
  --hsf-field-textarea__padding: 12px 16px;

  /* Field Checkbox */
  --hsf-field-checkbox__padding: 2px;
  --hsf-field-checkbox__background-color: #ffffff;
  --hsf-field-checkbox__color: #010E2E;
  --hsf-field-checkbox__border-color: rgba(0, 0, 0, 0.2);
  --hsf-field-checkbox__border-width: 1px;
  --hsf-field-checkbox__border-style: solid;

  /* Field Radio */
  --hsf-field-radio__padding: 2px;
  --hsf-field-radio__background-color: #ffffff;
  --hsf-field-radio__color: #010E2E;
  --hsf-field-radio__border-color: rgba(0, 0, 0, 0.2);
  --hsf-field-radio__border-width: 1px;
  --hsf-field-radio__border-style: solid;
}

/* Make all form fields fill 100% width */
.hs-form-html {
  width: 100%;
}

.hs-form-html form {
  width: 100% !important;
}

.hs-form-html .hs-form-field {
  width: 100% !important;
}

.hs-form-html input[type="text"],
.hs-form-html input[type="email"],
.hs-form-html input[type="tel"],
.hs-form-html input[type="number"],
.hs-form-html input[type="date"],
.hs-form-html input[type="url"],
.hs-form-html select,
.hs-form-html textarea {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.hs-form-html .hs-input {
  width: 100% !important;
  max-width: 100% !important;
}

/* Button: full-width + bold to match Ajax lead form submit */
.hs-form-html button[type="submit"],
.hs-form-html input[type="submit"],
.hs-form-html .hs-button {
  width: 100% !important;
  max-width: 100% !important;
  font-weight: 700 !important;
  letter-spacing: 0.01em !important;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.hs-form-html button[type="submit"]:hover:not(:disabled),
.hs-form-html input[type="submit"]:hover:not(:disabled),
.hs-form-html .hs-button:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

/* Label — mirrors labelStyle in AjaxHubSpotFormV2.tsx (lines 204-207):
   fontSize 16, fontWeight 400, color #010E2E, lineHeight 1em,
   fontFamily 'Inter' sans-serif, marginBottom 12 (LABEL_INPUT_GAP) */
.hs-form-html label,
.hs-form-html .hs-form-field label {
  font-family: 'Inter', sans-serif !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  line-height: 1em !important;
  color: #010E2E !important;
  opacity: 1 !important;
  margin-bottom: 12px !important;
}

/* Input — mirrors inputStyle in AjaxHubSpotFormV2.tsx (lines 198-203):
   padding 12px 16px, fontSize 16, lineHeight 1.5em, color #010E2E,
   bg #ffffff, border 1px solid rgba(0,0,0,0.2), borderRadius 8,
   fontFamily 'Inter' sans-serif, appearance none */
.hs-form-html input[type="text"],
.hs-form-html input[type="email"],
.hs-form-html input[type="tel"],
.hs-form-html input[type="number"],
.hs-form-html input[type="date"],
.hs-form-html input[type="url"],
.hs-form-html input[type="password"],
.hs-form-html select,
.hs-form-html textarea {
  font-family: 'Inter', sans-serif !important;
  font-size: 16px !important;
  line-height: 1.5em !important;
  color: #010E2E !important;
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  outline: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  transition: border-color 0.15s;
}

/* Placeholder — mirrors scoped CSS in AjaxHubSpotFormV2.tsx (lines 31-34):
   rgba(0,0,0,0.5), Inter 16px */
.hs-form-html input::placeholder,
.hs-form-html textarea::placeholder {
  color: rgba(0, 0, 0, 0.5) !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 16px !important;
}

/* Button — mirrors buttonBase in AjaxHubSpotFormV2.tsx (lines 212-219):
   padding 12px 24px, bg #3804E6, color #fff, fontSize 16,
   fontWeight 500, border none, borderRadius 48, fontFamily 'Inter' */
.hs-form-html button[type="submit"],
.hs-form-html input[type="submit"],
.hs-form-html .hs-button {
  font-family: 'Inter', sans-serif !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  line-height: 1.5em !important;
  color: #ffffff !important;
  background-color: #3804E6 !important;
  background-image: none !important;
  border: none !important;
  border-radius: 48px !important;
  padding: 12px 24px !important;
  letter-spacing: 0em !important;
  cursor: pointer;
  transition: background-color 0.15s;
}

.hs-form-html button[type="submit"]:hover:not(:disabled),
.hs-form-html input[type="submit"]:hover:not(:disabled),
.hs-form-html .hs-button:hover:not(:disabled) {
  background-color: #2D08FF !important;
}

/* Focus — mirrors scoped CSS in AjaxHubSpotFormV2.tsx (lines 31-34):
   border-color #3804E6, box-shadow explicitly none (no ring) */
.hs-form-html input:focus,
.hs-form-html select:focus,
.hs-form-html textarea:focus {
  border-color: #3804E6 !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Submit-button row — force 24px gap from the preceding field row so
   it matches field-to-field spacing exactly. Covers both the wrapper
   row and common HubSpot submit-module class names. */
.hs-form-html .hsfc-Form__Submit,
.hs-form-html .hs-submit,
.hs-form-html [class*="FormSubmit"],
.hs-form-html [class*="SubmitButton"] {
  margin-top: 24px !important;
}
            `}</style>

            <div
                ref={containerRef}
                className="hs-form-html"
                data-region={region}
                data-form-id={formId}
                data-portal-id={portalId}
            />
        </div>
    )
}

AjaxNewsletterHubSpotForm.displayName = "Ajax Newsletter HubSpot Form"

AjaxNewsletterHubSpotForm.defaultProps = {
    portalId: "23114530",
    formId: "24764996-104b-438d-aa42-6eb99ac99572",
    region: "na1",
}

addPropertyControls(AjaxNewsletterHubSpotForm, {
    portalId: {
        type: ControlType.String,
        title: "Portal ID",
        defaultValue: "23114530",
        placeholder: "Enter HubSpot Portal ID",
    },
    formId: {
        type: ControlType.String,
        title: "Form ID",
        defaultValue: "24764996-104b-438d-aa42-6eb99ac99572",
        placeholder: "Enter HubSpot Form ID",
    },
    region: {
        type: ControlType.String,
        title: "Region",
        defaultValue: "na1",
        placeholder: "e.g., na1, na2, eu1",
    },
})
