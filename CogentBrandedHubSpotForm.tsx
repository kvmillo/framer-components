// Framer Code Component — Cogent Branded HubSpot Form
// Uses HubSpot's developer embed (field config managed in HubSpot, not code).
// Adds:
//   · UTM auto-capture + sessionStorage persistence across page navigations
//   · CID injection via property control
//   · Custom success slot (Framer-designed thank-you layer)
//   · Cogent design tokens applied via HubSpot's --hsf-* CSS variables

import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef, useState } from "react"

const SESSION_KEY = "cogent_hs_form_params"

// ── Cogent Design Tokens ────────────────────────────────────
const FONT = "'Geist', sans-serif"

const LABEL_COLOR = "#3D4148"
const PLACEHOLDER_COLOR = "#B5C0C7"
const INPUT_VALUE_COLOR = "#636D7A"
const ERROR_COLOR = "#DA5C57"

const INPUT_BG = "#FFFFFF"
const BORDER_DEFAULT = "#D3DBDD"
const BORDER_FOCUS = "#A6B1BC"
const INPUT_RADIUS = 6
const INPUT_PADDING = "10px"

const ROW_GAP = 30
const COL_GAP = 20
const LABEL_GAP = 4

const CHECKBOX_INNER_COLOR = "#D8813E"
const CHECKBOX_LABEL_COLOR = "#636D7A"

const BUTTON_BG = "#111112"
const BUTTON_BG_HOVER = "#232325"
const BUTTON_TEXT_COLOR = "#FFFFFF"
const BUTTON_RADIUS = 8
const BUTTON_PADDING = "10px 26px"

const TRANSITION = "150ms ease"

// ── Helpers ─────────────────────────────────────────────────
function captureAndPersistParams(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const p = new URLSearchParams(window.location.search)
    let stored: Record<string, string> = {}
    try { stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
    ;["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
        .forEach(k => { const v = p.get(k); if (v) stored[k] = v })
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored)) } catch {}
    return stored
}

// ── Types ───────────────────────────────────────────────────
type Props = {
    portalId?: string
    formId?: string
    region?: string
    cidValue?: string
    successContent?: React.ReactNode
    debug?: boolean
    style?: React.CSSProperties
}

// ── Component ───────────────────────────────────────────────
/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CogentBrandedHubSpotForm(props: Props) {
    const {
        portalId = "48361805",
        formId = "0490e3d4-bfa5-4af6-8986-e5aa995fe3f1",
        region = "na2",
        cidValue,
        successContent,
        debug = false,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [submitted, setSubmitted] = useState(false)

    // Capture UTMs to sessionStorage on mount (preserves across page nav)
    useEffect(() => { captureAndPersistParams() }, [])

    // Load HubSpot developer embed script
    useEffect(() => {
        if (!portalId || !formId || !region) return
        const script = document.createElement("script")
        script.src = `https://js-${region}.hsforms.net/forms/embed/developer/${portalId}.js`
        script.defer = true
        document.body.appendChild(script)
        return () => { if (script.parentNode) script.parentNode.removeChild(script) }
    }, [portalId, formId, region])

    // Inject hidden field values + apply layout fixes whenever the form
    // renders, and detect submission via three independent signals:
    //   1. HubSpot custom events (hsFormCallback / hsFormEvent)
    //   2. MutationObserver — HubSpot's thank-you element appearing
    //   3. MutationObserver — the <form> being removed from the container
    // First signal wins; subsequent ones are ignored. With `debug` on,
    // every event and signal is logged to the console with [CogentForm].
    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current
        let hiddenInjected = false
        let formWasPresent = false
        let submittedFlag = false

        const log = (...args: unknown[]) => {
            if (debug) console.log("[CogentForm]", ...args)
        }

        const markSubmitted = (reason: string) => {
            if (submittedFlag) return
            submittedFlag = true
            log("submitted →", reason)
            setSubmitted(true)
            try { sessionStorage.removeItem(SESSION_KEY) } catch {}
        }

        const applyHiddenFields = (formEl: HTMLFormElement) => {
            let tracked: Record<string, string> = {}
            try { tracked = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
            const setField = (name: string, value: string) => {
                const input = formEl.querySelector(`input[name="${name}"]`) as HTMLInputElement | null
                if (input && value) {
                    input.value = value
                    input.dispatchEvent(new Event("input", { bubbles: true }))
                    input.dispatchEvent(new Event("change", { bubbles: true }))
                }
            }
            ;["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(k => {
                setField(k, tracked[k] || "")
            })
            if (cidValue) setField("cid", cidValue)
        }

        const applyLayoutFixes = (formEl: HTMLFormElement) => {
            // Submit button: natural width
            const submitBtn = formEl.querySelector(
                'button[type="submit"], input[type="submit"]'
            ) as HTMLElement | null
            if (submitBtn) {
                submitBtn.style.setProperty("width", "fit-content", "important")
                submitBtn.style.setProperty("max-width", "fit-content", "important")
                submitBtn.style.setProperty("flex", "0 0 auto", "important")
            }

            // Strip every margin/padding on every ancestor between the
            // submit button and the form root — this kills any spacer
            // wrapper HubSpot may add. Re-add 12px above the submit row
            // afterwards.
            if (submitBtn) {
                let el: HTMLElement | null = submitBtn.parentElement as HTMLElement | null
                while (el && el !== formEl) {
                    el.style.setProperty("margin", "0", "important")
                    el.style.setProperty("padding-top", "0", "important")
                    el.style.setProperty("padding-bottom", "0", "important")
                    el = el.parentElement
                }
            }

            // Walk through any single-child wrapper chain to find the
            // rows container (form > .hs-form-private > rows is common).
            let rowContainer: HTMLElement = formEl
            while (rowContainer.children.length === 1) {
                const onlyChild = rowContainer.firstElementChild as HTMLElement | null
                if (!onlyChild) break
                if (["INPUT","BUTTON","TEXTAREA","SELECT","LABEL"].includes(onlyChild.tagName)) break
                rowContainer = onlyChild
            }
            ;[formEl, rowContainer].forEach(el => {
                el.style.setProperty("display", "block", "important")
                el.style.setProperty("gap", "0", "important")
                el.style.setProperty("row-gap", "0", "important")
                el.style.setProperty("padding-top", "0", "important")
                el.style.setProperty("padding-bottom", "0", "important")
            })

            const hasCheckbox = (el: Element) =>
                el.classList.contains("hs-fieldtype-booleancheckbox") ||
                el.classList.contains("hs-fieldtype-checkbox") ||
                !!el.querySelector('input[type="checkbox"]')
            const isRichText = (el: Element) => {
                const cls = (el.className || "").toString().toLowerCase()
                return /richtext|legal|consent/.test(cls) ||
                    !!el.querySelector(".hs-richtext, .hs-form-richtext, .legal-consent-container")
            }
            const isSubmit = (el: Element) =>
                el.classList.contains("hs-submit") ||
                el.classList.contains("actions") ||
                !!el.querySelector('button[type="submit"], input[type="submit"]')

            const rows = Array.from(rowContainer.children).filter(el => {
                const t = el.tagName.toLowerCase()
                return t !== "style" && t !== "script"
            }) as HTMLElement[]

            rows.forEach((row, idx) => {
                row.style.setProperty("margin-top", "0", "important")
                row.style.setProperty("padding-top", "0", "important")
                row.style.setProperty("padding-bottom", "0", "important")
                let mb = "30px"
                if (hasCheckbox(row) || isRichText(row)) mb = "8px"
                if (isSubmit(row)) mb = "0px"
                const next = rows[idx + 1]
                if (next && isSubmit(next)) mb = "8px"
                row.style.setProperty("margin-bottom", mb, "important")
            })
        }

        const SUCCESS_SELECTOR =
            ".submitted-message, .hs-form-thankyou, .hs-thank-you-message, [data-hs-form-state='submitted']"

        const apply = () => {
            // DOM signal A: explicit thank-you element injected
            const successEl = container.querySelector(SUCCESS_SELECTOR)
            if (successEl) {
                markSubmitted(`DOM: matched ${SUCCESS_SELECTOR}`)
                return
            }

            const formEl = container.querySelector("form")

            // DOM signal B: form was here, now it's gone → success
            if (!formEl) {
                if (formWasPresent && !submittedFlag) {
                    markSubmitted("DOM: <form> removed from container")
                }
                return
            }

            formWasPresent = true
            if (!hiddenInjected) {
                hiddenInjected = true
                log("form ready, injecting hidden fields")
                applyHiddenFields(formEl)
            }
            applyLayoutFixes(formEl)
        }

        // Event-based detection — listen for every variant HubSpot ships:
        // hsFormCallback (most builds), hsFormEvent (some newer builds),
        // on both document and window. Only `onFormSubmitted` is treated
        // as success — `onFormSubmit` fires *before* the network round-
        // trip and would falsely hide the form on validation errors.
        const eventHandler = (event: Event) => {
            const detail = (event as CustomEvent).detail
            log("event:", event.type, detail)
            if (!detail) return
            const eventType = String(detail.type || detail.eventName || "")
            if (eventType === "onFormReady") apply()
            if (eventType === "onFormSubmitted") {
                markSubmitted(`event ${event.type} type=${eventType}`)
            }
        }
        const eventNames = ["hsFormCallback", "hsFormEvent"]
        eventNames.forEach((n) => {
            document.addEventListener(n, eventHandler)
            window.addEventListener(n, eventHandler)
        })

        // MutationObserver — catches both DOM signals (success element,
        // form removal) and re-runs spacing/hidden-field injection on
        // every container update.
        const observer = new MutationObserver(() => apply())
        observer.observe(container, { childList: true, subtree: true })

        // Initial pass in case the form is already there
        apply()

        log("listeners attached, observer watching", container)

        return () => {
            eventNames.forEach((n) => {
                document.removeEventListener(n, eventHandler)
                window.removeEventListener(n, eventHandler)
            })
            observer.disconnect()
        }
    }, [cidValue, debug])

    // ── Custom Success State ──────────────────────────────
    if (submitted) {
        return (
            <div className="cogent-hs-branded" style={{ width: "100%", ...style }}>
                <style>{`
                    .cogent-hs-branded .cogent-success{width:100%;display:flex;flex-direction:column;align-items:stretch}
                    .cogent-hs-branded .cogent-success > *{width:100% !important;max-width:100% !important;flex:1 1 auto !important}
                `}</style>
                <div className="cogent-success">
                    {successContent ?? (
                        <div style={{ fontFamily: FONT, fontSize: 16, color: LABEL_COLOR }}>
                            Thanks! We'll be in touch shortly.
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ── Form ──────────────────────────────────────────────
    return (
        <div style={{ width: "100%", ...style }}>
            <style>{`
:root {
  /* Global */
  --hsf-global__font-family: ${FONT};
  --hsf-global__font-size: 16px;
  --hsf-global__color: ${LABEL_COLOR};
  --hsf-global-error__color: ${ERROR_COLOR};

  /* Spacing */
  --hsf-row__horizontal-spacing: ${COL_GAP}px;
  --hsf-row__vertical-spacing: ${ROW_GAP}px;
  --hsf-module__vertical-spacing: ${LABEL_GAP}px;

  /* Button */
  --hsf-button__font-family: ${FONT};
  --hsf-button__font-size: 16px;
  --hsf-button__color: ${BUTTON_TEXT_COLOR};
  --hsf-button__background-color: ${BUTTON_BG};
  --hsf-button__background-image: none;
  --hsf-button__border-radius: ${BUTTON_RADIUS}px;
  --hsf-button__padding: ${BUTTON_PADDING};
  --hsf-button__box-shadow: none;

  /* Rich Text (consent / paragraph blocks added in HubSpot) */
  --hsf-richtext__font-family: ${FONT};
  --hsf-richtext__font-size: 16px;
  --hsf-richtext__color: ${INPUT_VALUE_COLOR};

  /* Heading */
  --hsf-heading__font-family: ${FONT};
  --hsf-heading__color: ${LABEL_COLOR};
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
  --hsf-erroralert__font-family: ${FONT};
  --hsf-erroralert__font-size: 8px;
  --hsf-erroralert__color: ${ERROR_COLOR};

  /* Field Label */
  --hsf-field-label__font-family: ${FONT};
  --hsf-field-label__font-size: 16px;
  --hsf-field-label__color: ${LABEL_COLOR};
  --hsf-field-label-requiredindicator__color: ${ERROR_COLOR};
  --hsf-field-description__font-family: ${FONT};
  --hsf-field-description__color: ${INPUT_VALUE_COLOR};
  --hsf-field-footer__font-family: ${FONT};
  --hsf-field-footer__color: ${INPUT_VALUE_COLOR};

  /* Field Input */
  --hsf-field-input__font-family: ${FONT};
  --hsf-field-input__color: ${INPUT_VALUE_COLOR};
  --hsf-field-input__background-color: ${INPUT_BG};
  --hsf-field-input__placeholder-color: ${PLACEHOLDER_COLOR};
  --hsf-field-input__border-color: ${BORDER_DEFAULT};
  --hsf-field-input__border-width: 1px;
  --hsf-field-input__border-style: solid;
  --hsf-field-input__border-radius: ${INPUT_RADIUS}px;
  --hsf-field-input__padding: ${INPUT_PADDING};

  /* Field Textarea */
  --hsf-field-textarea__font-family: ${FONT};
  --hsf-field-textarea__color: ${INPUT_VALUE_COLOR};
  --hsf-field-textarea__background-color: ${INPUT_BG};
  --hsf-field-textarea__placeholder-color: ${PLACEHOLDER_COLOR};
  --hsf-field-textarea__border-color: ${BORDER_DEFAULT};
  --hsf-field-textarea__border-width: 1px;
  --hsf-field-textarea__border-style: solid;
  --hsf-field-textarea__border-radius: ${INPUT_RADIUS}px;
  --hsf-field-textarea__padding: ${INPUT_PADDING};

  /* Field Checkbox */
  --hsf-field-checkbox__padding: 0px;
  --hsf-field-checkbox__background-color: ${INPUT_BG};
  --hsf-field-checkbox__color: ${CHECKBOX_INNER_COLOR};
  --hsf-field-checkbox__border-color: ${BORDER_DEFAULT};
  --hsf-field-checkbox__border-width: 1px;
  --hsf-field-checkbox__border-style: solid;

  /* Field Radio */
  --hsf-field-radio__padding: 0px;
  --hsf-field-radio__background-color: ${INPUT_BG};
  --hsf-field-radio__color: ${CHECKBOX_INNER_COLOR};
  --hsf-field-radio__border-color: ${BORDER_DEFAULT};
  --hsf-field-radio__border-width: 1px;
  --hsf-field-radio__border-style: solid;
}

/* ── Layout overrides — full-width fields ── */
.hs-form-html, .hs-form-html form, .hs-form-html .hs-form-field { width: 100% !important; }
.hs-form-html input[type="text"],
.hs-form-html input[type="email"],
.hs-form-html input[type="tel"],
.hs-form-html input[type="number"],
.hs-form-html input[type="date"],
.hs-form-html input[type="url"],
.hs-form-html select,
.hs-form-html textarea,
.hs-form-html .hs-input {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  letter-spacing: 0em !important;
  line-height: 1.4em !important;
  font-size: 14px !important;
}

/* ── Letter spacing for labels (HubSpot doesn't expose a var) ── */
.hs-form-html label,
.hs-form-html .hs-form-field label {
  letter-spacing: -0.02em !important;
  line-height: 1.4em !important;
}

/* ── Focus state — border #A6B1BC, no outline ── */
.hs-form-html .hs-input:focus,
.hs-form-html input:focus,
.hs-form-html select:focus,
.hs-form-html textarea:focus {
  outline: none !important;
  border-color: ${BORDER_FOCUS} !important;
  box-shadow: none !important;
}

/* ── Custom checkbox/radio (matches CogentHubSpotForm 1:1) ── */
/* Hide the real input — keep it positioned over the fake box for clicks */
.hs-form-html input[type="checkbox"],
.hs-form-html input[type="radio"] {
  appearance: none !important;
  -webkit-appearance: none !important;
  position: absolute !important;
  opacity: 0 !important;
  width: 16px !important;
  height: 16px !important;
  margin: 0 !important;
  padding: 0 !important;
  cursor: pointer !important;
  left: 0 !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2;
  background: transparent !important;
  border: none !important;
}

/* Container — any element wrapping a checkbox/radio. Uses :has() so we
   don't depend on HubSpot's specific class names. Falls back to any
   known HubSpot wrapper classes too. */
.hs-form-html label:has(> input[type="checkbox"]),
.hs-form-html label:has(> input[type="radio"]),
.hs-form-html .hs-form-booleancheckbox-display,
.hs-form-html .hs-form-checkbox-display,
.hs-form-html .hs-form-radio-display {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding-left: 24px !important;
  cursor: pointer !important;
  min-height: 16px !important;
  background: transparent !important;
  border: none !important;
  font-family: ${FONT} !important;
  font-size: 16px !important;
  line-height: 1.4em !important;
  letter-spacing: -0.02em !important;
  color: ${INPUT_VALUE_COLOR} !important;
  font-weight: 400 !important;
}

/* Fake box (the visible checkbox) */
.hs-form-html label:has(> input[type="checkbox"])::before,
.hs-form-html label:has(> input[type="radio"])::before,
.hs-form-html .hs-form-booleancheckbox-display::before,
.hs-form-html .hs-form-checkbox-display::before,
.hs-form-html .hs-form-radio-display::before {
  content: "" !important;
  position: absolute !important;
  left: 0 !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 16px !important;
  height: 16px !important;
  background: ${INPUT_BG} !important;
  border: 1px solid ${BORDER_DEFAULT} !important;
  border-radius: 2px !important;
  transition: border-color ${TRANSITION} !important;
  box-sizing: border-box !important;
  display: block !important;
}

/* Inner orange — hidden by default, fades in on :checked */
.hs-form-html label:has(> input[type="checkbox"])::after,
.hs-form-html label:has(> input[type="radio"])::after,
.hs-form-html .hs-form-booleancheckbox-display::after,
.hs-form-html .hs-form-checkbox-display::after,
.hs-form-html .hs-form-radio-display::after {
  content: "" !important;
  position: absolute !important;
  left: 4px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 8px !important;
  height: 8px !important;
  background: ${CHECKBOX_INNER_COLOR} !important;
  opacity: 0 !important;
  transition: opacity ${TRANSITION} !important;
  display: block !important;
  pointer-events: none !important;
}

/* Hover — border darkens */
.hs-form-html label:has(> input[type="checkbox"]):hover::before,
.hs-form-html label:has(> input[type="radio"]):hover::before,
.hs-form-html .hs-form-booleancheckbox-display:hover::before,
.hs-form-html .hs-form-checkbox-display:hover::before,
.hs-form-html .hs-form-radio-display:hover::before {
  border-color: ${BORDER_FOCUS} !important;
}

/* Checked — show the orange inner */
.hs-form-html label:has(input:checked)::after,
.hs-form-html .hs-form-booleancheckbox-display:has(input:checked)::after,
.hs-form-html .hs-form-checkbox-display:has(input:checked)::after,
.hs-form-html .hs-form-radio-display:has(input:checked)::after {
  opacity: 1 !important;
}

/* ── Submit button — natural width, Cogent type spec ── */
/* Force the button's parent to behave as a normal flex row so the button
   doesn't get stretched by HubSpot's default styling. */
.hs-form-html .hs-submit,
.hs-form-html .actions,
.hs-form-html div:has(> button[type="submit"]),
.hs-form-html div:has(> input[type="submit"]) {
  text-align: left !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: row !important;
  justify-content: flex-start !important;
  align-items: center !important;
}
.hs-form-html button[type="submit"],
.hs-form-html input[type="submit"],
.hs-form-html .hs-button,
.hs-form-html button.primary,
.hs-form-html .submit-button,
.hs-form-html .actions > button,
.hs-form-html .actions > input[type="submit"],
.hs-form-html .hs-submit > button,
.hs-form-html .hs-submit > input[type="submit"] {
  width: fit-content !important;
  max-width: fit-content !important;
  min-width: 0 !important;
  flex: 0 0 auto !important;
  flex-grow: 0 !important;
  flex-shrink: 0 !important;
  align-self: flex-start !important;
  height: 42px !important;
  padding: ${BUTTON_PADDING} !important;
  font-family: ${FONT} !important;
  font-size: 16px !important;
  line-height: 1.2em !important;
  letter-spacing: 0em !important;
  font-weight: 400 !important;
  cursor: pointer !important;
  transition: background-color ${TRANSITION} !important;
  border: none !important;
  border-radius: ${BUTTON_RADIUS}px !important;
  background-color: ${BUTTON_BG} !important;
  color: ${BUTTON_TEXT_COLOR} !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: none !important;
}
.hs-form-html button[type="submit"]:hover,
.hs-form-html input[type="submit"]:hover,
.hs-form-html .hs-button:hover,
.hs-form-html button.primary:hover,
.hs-form-html .submit-button:hover {
  background-color: ${BUTTON_BG_HOVER} !important;
}

/* ── Row spacing is applied via JS inline styles in onFormReady ──
   (CSS approach kept losing to HubSpot's stylesheet specificity / load
   order). Search the .tsx for applySpacing to see / tweak values. */

/* ── Rich text internal spacing — kill default <p>/heading margins
   and container padding so the row's margin-bottom is the only gap.
   Without this, browser-default <p> margins (~16px top/bottom) stack
   on top of our row spacing and the checkbox→richtext→button gaps
   look much larger than intended. ── */
.hs-form-html .hs-richtext,
.hs-form-html .hs-form-richtext,
.hs-form-html .legal-consent-container {
  padding: 0 !important;
  margin: 0 !important;
}
.hs-form-html .hs-richtext p,
.hs-form-html .hs-form-richtext p,
.hs-form-html .legal-consent-container p,
.hs-form-html .hs-richtext h1, .hs-form-html .hs-richtext h2,
.hs-form-html .hs-richtext h3, .hs-form-html .hs-richtext h4,
.hs-form-html .hs-richtext h5, .hs-form-html .hs-richtext h6,
.hs-form-html .hs-form-richtext h1, .hs-form-html .hs-form-richtext h2,
.hs-form-html .hs-form-richtext h3, .hs-form-html .hs-form-richtext h4,
.hs-form-html .hs-form-richtext h5, .hs-form-html .hs-form-richtext h6 {
  margin: 0 !important;
  padding: 0 !important;
}

/* ── Rich text links (Privacy Notice / legal blocks) ── */
.hs-form-html .hs-richtext a,
.hs-form-html .hs-form-richtext a,
.hs-form-html .legal-consent-container a,
.hs-form-html p a {
  color: inherit !important;
  text-decoration: underline !important;
  transition: color ${TRANSITION} !important;
}
.hs-form-html .hs-richtext a:hover,
.hs-form-html .hs-form-richtext a:hover,
.hs-form-html .legal-consent-container a:hover,
.hs-form-html p a:hover {
  color: #111111 !important;
}

/* ── Error helper text ── */
.hs-form-html .hs-error-msg,
.hs-form-html .hs-error-msgs {
  font-size: 8px !important;
  line-height: 1.4em !important;
  color: ${ERROR_COLOR} !important;
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

CogentBrandedHubSpotForm.displayName = "Cogent Branded HubSpot Form"

addPropertyControls(CogentBrandedHubSpotForm, {
    portalId: {
        type: ControlType.String,
        title: "Portal ID",
        defaultValue: "48361805",
        placeholder: "HubSpot Portal ID",
    },
    formId: {
        type: ControlType.String,
        title: "Form ID",
        defaultValue: "0490e3d4-bfa5-4af6-8986-e5aa995fe3f1",
        placeholder: "HubSpot Form ID",
    },
    region: {
        type: ControlType.String,
        title: "Region",
        defaultValue: "na2",
        placeholder: "na1, na2, eu1",
    },
    cidValue: {
        type: ControlType.String,
        title: "CID",
        defaultValue: "",
        placeholder: "Campaign ID (optional)",
    },
    successContent: {
        type: ControlType.ComponentInstance,
        title: "Success Slot",
    },
    debug: {
        type: ControlType.Boolean,
        title: "Debug",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
