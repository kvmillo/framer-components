import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef } from "react"

export default function BrandedHubSpotForm({ portalId, formId, region }) {
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
  /* Global Styling */
  --hsf-global__font-family: 'Inter', sans-serif;
  --hsf-global__font-size: 16px;
  --hsf-global__color: #111111;
  --hsf-global-error__color: #e74c3c;

  /* Row Spacing */
  --hsf-row__horizontal-spacing: 16px;
  --hsf-row__vertical-spacing: 32px;
  --hsf-module__vertical-spacing: 16px;

  /* Button */
  --hsf-button__font-family: 'Inter', sans-serif;
  --hsf-button__font-size: 16px;
  --hsf-button__color: #000000;
  --hsf-button__background-color: #FFEC35;
  --hsf-button__background-image: none;
  --hsf-button__border-radius: 48px;
  --hsf-button__padding: 20px;
  --hsf-button__box-shadow: none;

  /* Rich Text */
  --hsf-richtext__font-family: 'Inter', sans-serif;
  --hsf-richtext__font-size: 16px;
  --hsf-richtext__color: #111111;

  /* Heading */
  --hsf-heading__font-family: 'Inter', sans-serif;
  --hsf-heading__color: #111111;
  --hsf-heading__text-shadow: none;

  /* Background */
  --hsf-background__background-color: transparent;
  --hsf-background__background-image: none;
  --hsf-background__background-size: 100% auto;
  --hsf-background__background-position: center center;
  --hsf-background__background-repeat: no-repeat;
  --hsf-background__border-style: none;
  --hsf-background__border-color: transparent;
  --hsf-background__border-radius: 0px;
  --hsf-background__border-width: 0px;
  --hsf-background__padding: 0px;

  /* Progress Bar */
  --hsf-progressbar-text__font-family: 'Inter', sans-serif;
  --hsf-progressbar-text__font-size: 12px;
  --hsf-progressbar-text__color: rgba(17, 17, 17, 0.7);
  --hsf-progressbar-progressLine__background-color: #F6F6ED;
  --hsf-progressbar-progressLine__background-image: none;
  --hsf-progressbar-progressLine__border-color: #FFEC35;
  --hsf-progressbar-progressLine__border-style: none;
  --hsf-progressbar-progressLine__border-width: 0px;
  --hsf-progressbar-trackLine__background-color: transparent;

  /* Error Alert */
  --hsf-erroralert__font-family: 'Inter', sans-serif;
  --hsf-erroralert__font-size: 12px;
  --hsf-erroralert__color: #dc3545;

  /* Info Alert */
  --hsf-infoalert__font-family: 'Inter', sans-serif;
  --hsf-infoalert__font-size: 14px;
  --hsf-infoalert__color: rgba(17, 17, 17, 0.7);

  /* Field Input */
  --hsf-field-label__font-family: 'Inter', sans-serif;
  --hsf-field-label__font-size: 20px;
  --hsf-field-label__color: #111111;
  --hsf-field-label-requiredindicator__color: #dc3545;
  --hsf-field-description__font-family: 'Inter', sans-serif;
  --hsf-field-description__color: rgba(17, 17, 17, 0.7);
  --hsf-field-footer__font-family: 'Inter', sans-serif;
  --hsf-field-footer__color: rgba(17, 17, 17, 0.7);
  --hsf-field-input__font-family: 'Inter', sans-serif;
  --hsf-field-input__color: #111111;
  --hsf-field-input__background-color: #F6F6ED;
  --hsf-field-input__placeholder-color: rgba(17, 17, 17, 0.4);
  --hsf-field-input__border-color: rgba(17, 17, 17, 0.16);
  --hsf-field-input__border-width: 1px;
  --hsf-field-input__border-style: solid;
  --hsf-field-input__border-radius: 12px;
  --hsf-field-input__padding: 20px 16px;

  /* Field Textarea */
  --hsf-field-textarea__font-family: 'Inter', sans-serif;
  --hsf-field-textarea__color: #111111;
  --hsf-field-textarea__background-color: #F6F6ED;
  --hsf-field-textarea__placeholder-color: rgba(17, 17, 17, 0.4);
  --hsf-field-textarea__border-color: rgba(17, 17, 17, 0.16);
  --hsf-field-textarea__border-width: 1px;
  --hsf-field-textarea__border-style: solid;
  --hsf-field-textarea__border-radius: 12px;
  --hsf-field-textarea__padding: 20px 16px;

  /* Field Checkbox */
  --hsf-field-checkbox__padding: 2px;
  --hsf-field-checkbox__background-color: #F6F6ED;
  --hsf-field-checkbox__color: #111111;
  --hsf-field-checkbox__border-color: rgba(17, 17, 17, 0.16);
  --hsf-field-checkbox__border-width: 1px;
  --hsf-field-checkbox__border-style: solid;

  /* Field Radio */
  --hsf-field-radio__padding: 2px;
  --hsf-field-radio__background-color: #F6F6ED;
  --hsf-field-radio__color: #111111;
  --hsf-field-radio__border-color: rgba(17, 17, 17, 0.16);
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

/* Make button fill 100% width */
.hs-form-html button[type="submit"],
.hs-form-html input[type="submit"],
.hs-form-html .hs-button {
  width: 100% !important;
  max-width: 100% !important;
}

/* Make field labels semibold */
.hs-form-html label,
.hs-form-html .hs-form-field label {
  font-weight: 600 !important;
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

BrandedHubSpotForm.displayName = "Branded HubSpot Form"

BrandedHubSpotForm.defaultProps = {
    portalId: "245273680",
    formId: "327d3689-8ab3-4c38-849d-d5a02f762825",
    region: "na2",
}

addPropertyControls(BrandedHubSpotForm, {
    portalId: {
        type: ControlType.String,
        title: "Portal ID",
        defaultValue: "245273680",
        placeholder: "Enter HubSpot Portal ID",
    },
    formId: {
        type: ControlType.String,
        title: "Form ID",
        defaultValue: "327d3689-8ab3-4c38-849d-d5a02f762825",
        placeholder: "Enter HubSpot Form ID",
    },
    region: {
        type: ControlType.String,
        title: "Region",
        defaultValue: "na2",
        placeholder: "e.g., na1, na2, eu1",
    },
})
