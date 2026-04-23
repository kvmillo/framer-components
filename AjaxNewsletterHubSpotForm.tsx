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
:root {
  /* Global */
  --hsf-global__font-family: inherit;
  --hsf-global__font-size: 15px;
  --hsf-global__color: #1a1a1a;
  --hsf-global-error__color: #e74c3c;

  /* Row Spacing */
  --hsf-row__horizontal-spacing: 16px;
  --hsf-row__vertical-spacing: 20px;
  --hsf-module__vertical-spacing: 12px;

  /* Button — purple pill, matches Ajax lead form */
  --hsf-button__font-family: inherit;
  --hsf-button__font-size: 15px;
  --hsf-button__color: #ffffff;
  --hsf-button__background-color: #6B4EFF;
  --hsf-button__background-image: none;
  --hsf-button__border-radius: 100px;
  --hsf-button__padding: 14px 32px;
  --hsf-button__box-shadow: none;

  /* Rich Text */
  --hsf-richtext__font-family: inherit;
  --hsf-richtext__font-size: 15px;
  --hsf-richtext__color: #1a1a1a;

  /* Heading */
  --hsf-heading__font-family: inherit;
  --hsf-heading__color: #1a1a1a;
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
  --hsf-erroralert__font-family: inherit;
  --hsf-erroralert__font-size: 13px;
  --hsf-erroralert__color: #e74c3c;

  /* Info Alert */
  --hsf-infoalert__font-family: inherit;
  --hsf-infoalert__font-size: 14px;
  --hsf-infoalert__color: rgba(26, 26, 26, 0.7);

  /* Field Label */
  --hsf-field-label__font-family: inherit;
  --hsf-field-label__font-size: 14px;
  --hsf-field-label__color: #aaaaaa;
  --hsf-field-label-requiredindicator__color: #e74c3c;
  --hsf-field-description__font-family: inherit;
  --hsf-field-description__color: rgba(26, 26, 26, 0.7);
  --hsf-field-footer__font-family: inherit;
  --hsf-field-footer__color: rgba(26, 26, 26, 0.7);

  /* Field Input — white bg, transparent border, 10px radius */
  --hsf-field-input__font-family: inherit;
  --hsf-field-input__color: #1a1a1a;
  --hsf-field-input__background-color: #ffffff;
  --hsf-field-input__placeholder-color: rgba(26, 26, 26, 0.4);
  --hsf-field-input__border-color: transparent;
  --hsf-field-input__border-width: 1.5px;
  --hsf-field-input__border-style: solid;
  --hsf-field-input__border-radius: 10px;
  --hsf-field-input__padding: 14px 16px;

  /* Field Textarea */
  --hsf-field-textarea__font-family: inherit;
  --hsf-field-textarea__color: #1a1a1a;
  --hsf-field-textarea__background-color: #ffffff;
  --hsf-field-textarea__placeholder-color: rgba(26, 26, 26, 0.4);
  --hsf-field-textarea__border-color: transparent;
  --hsf-field-textarea__border-width: 1.5px;
  --hsf-field-textarea__border-style: solid;
  --hsf-field-textarea__border-radius: 10px;
  --hsf-field-textarea__padding: 14px 16px;

  /* Field Checkbox */
  --hsf-field-checkbox__padding: 2px;
  --hsf-field-checkbox__background-color: #ffffff;
  --hsf-field-checkbox__color: #1a1a1a;
  --hsf-field-checkbox__border-color: rgba(26, 26, 26, 0.16);
  --hsf-field-checkbox__border-width: 1px;
  --hsf-field-checkbox__border-style: solid;

  /* Field Radio */
  --hsf-field-radio__padding: 2px;
  --hsf-field-radio__background-color: #ffffff;
  --hsf-field-radio__color: #1a1a1a;
  --hsf-field-radio__border-color: rgba(26, 26, 26, 0.16);
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

/* Label weight to match Ajax lead form (fontWeight: 500, opacity: 0.85) */
.hs-form-html label,
.hs-form-html .hs-form-field label {
  font-weight: 500 !important;
  opacity: 0.85;
}

/* Focus ring to match Ajax lead form (#6B4EFF at 20% alpha) */
.hs-form-html input:focus,
.hs-form-html select:focus,
.hs-form-html textarea:focus {
  border-color: #6B4EFF !important;
  box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.2) !important;
  outline: none !important;
}

/* Hide the HubSpot template banner image.
   The newsletter template renders the image as an inline
   background-image on .hsfc-Step__Banner (not an <img>),
   so hiding that element is what actually works. */
.hs-form-html .hsfc-Step__Banner {
  display: none !important;
}

/* Belt-and-suspenders for other form templates */
.hs-form-html img,
.hs-form-html picture {
  display: none !important;
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
