// Framer Code Component — Cogent Newsletter HubSpot Form (Direct API)
// Portal ID: 48361805 | Form ID: 6bff713e-8f25-4535-a6c3-3afb1f5727f2
//
// Single-row newsletter signup:
//   · Email input + Subscribe button side-by-side
//   · UTM auto-capture (persisted via sessionStorage)
//   · CID via dedicated property control
//   · Hidden fields: utm_source, utm_medium, utm_campaign, utm_content, utm_term, cid
//   · Inline success message (configurable)
//   · Caption with split props: prefix text + link label + link URL
//   · Uses HubSpot v2 endpoint so notifications/workflows still fire

import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const PORTAL_ID = "48361805"
const FORM_ID = "6bff713e-8f25-4535-a6c3-3afb1f5727f2"
const SESSION_KEY = "cogent_hs_form_params"

// ── Design Tokens ────────────────────────────────────────────
const FONT = "'Geist', sans-serif"

// Input
const INPUT_BG = "transparent"
const INPUT_TEXT_COLOR = "#FFFFFF"
const INPUT_PLACEHOLDER_COLOR = "#8E9AA8"
const BORDER_DEFAULT = "#3F3F43"
const BORDER_FOCUS = "#636D7A"
const BORDER_ERROR = "#DA5C57"
const INPUT_RADIUS = 8
const INPUT_HEIGHT = 42
const INPUT_PADDING_X = 14
const INPUT_SIZE = 14
const INPUT_LINE_HEIGHT = "1.4em"

// Button
const BUTTON_BG = "#FFFFFF"
const BUTTON_BG_HOVER = "#EFEFEF"
const BUTTON_TEXT_COLOR = "#111111"
const BUTTON_SIZE = 16
const BUTTON_LINE_HEIGHT = "1.2em"
const BUTTON_RADIUS = 8
const BUTTON_PADDING = "10px 26px"
const BUTTON_HEIGHT = 42

// Caption
const CAPTION_COLOR = "#56565C"
const CAPTION_LINK_COLOR = "#FFFFFF"
const CAPTION_SIZE = 10
const CAPTION_LINE_HEIGHT = "1.4em"

const ROW_GAP = 12 // gap between input row and caption
const COL_GAP = 12 // gap between input and button
const TRANSITION = "150ms ease"

// ── Scoped CSS ──────────────────────────────────────────────
const FORM_CLASS = "cogent-newsletter-form"
const formCSS = `
.${FORM_CLASS} input::placeholder{color:${INPUT_PLACEHOLDER_COLOR};font-family:${FONT};font-size:${INPUT_SIZE}px;line-height:${INPUT_LINE_HEIGHT};letter-spacing:0em;opacity:1}
.${FORM_CLASS} input:focus,.${FORM_CLASS} button:focus{outline:none;box-shadow:none}
.${FORM_CLASS} input:-webkit-autofill,.${FORM_CLASS} input:-webkit-autofill:hover,.${FORM_CLASS} input:-webkit-autofill:focus{-webkit-text-fill-color:${INPUT_TEXT_COLOR};-webkit-box-shadow:0 0 0 1000px transparent inset;transition:background-color 9999s ease-in-out 0s;caret-color:${INPUT_TEXT_COLOR}}
.${FORM_CLASS} .cogent-caption a{color:${CAPTION_LINK_COLOR};text-decoration:none;transition:opacity ${TRANSITION}}
.${FORM_CLASS} .cogent-caption a:hover{opacity:0.5}
.${FORM_CLASS} .cogent-spinner{width:16px;height:16px;border:2px solid rgba(17,17,17,0.25);border-top-color:#111;border-radius:50%;animation:cogent-newsletter-spin 0.7s linear infinite;display:inline-block}
@keyframes cogent-newsletter-spin{to{transform:rotate(360deg)}}
`

// ── Helpers ─────────────────────────────────────────────────
function getCookie(name: string): string {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
    return match ? decodeURIComponent(match[2]) : ""
}
function isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}
function captureAndPersistParams(): Record<string, string> {
    const p = new URLSearchParams(window.location.search)
    let stored: Record<string, string> = {}
    try { stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
    ;["utm_source","utm_medium","utm_campaign","utm_term","utm_content"]
        .forEach(k => { const v = p.get(k); if (v) stored[k] = v })
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored)) } catch {}
    return stored
}

// ── Types ───────────────────────────────────────────────────
interface CogentNewsletterFormProps {
    placeholder?: string
    buttonLabel?: string
    cidValue?: string
    captionText?: string
    captionLinkLabel?: string
    captionLinkUrl?: string
    successMessage?: string
    style?: React.CSSProperties
}

// ── Component ───────────────────────────────────────────────
/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CogentNewsletterForm(props: CogentNewsletterFormProps) {
    const {
        placeholder,
        buttonLabel,
        cidValue,
        captionText,
        captionLinkLabel,
        captionLinkUrl,
        successMessage,
        style,
    } = props

    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState("")
    const [submitError, setSubmitError] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [focused, setFocused] = useState(false)
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        captureAndPersistParams()
        const id = "cogent-newsletter-form-styles"
        if (!document.getElementById(id)) {
            const el = document.createElement("style")
            el.id = id
            el.textContent = formCSS
            document.head.appendChild(el)
        }
    }, [])

    const handleSubmit = async () => {
        setSubmitError("")
        const trimmed = email.trim()
        if (!trimmed) {
            setEmailError("Required")
            return
        }
        if (!isValidEmail(trimmed)) {
            setEmailError("Please enter a valid email address.")
            return
        }
        setEmailError("")
        setStatus("loading")

        let tracked: Record<string, string> = {}
        try { tracked = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
        const hutk = getCookie("hubspotutk")

        const hsFields: { name: string; value: string }[] = [
            { name: "email", value: trimmed },
            { name: "utm_source", value: tracked.utm_source || "" },
            { name: "utm_medium", value: tracked.utm_medium || "" },
            { name: "utm_campaign", value: tracked.utm_campaign || "" },
            { name: "utm_term", value: tracked.utm_term || "" },
            { name: "utm_content", value: tracked.utm_content || "" },
            { name: "cid", value: cidValue || "" },
        ]
        const filtered = hsFields.filter(f => f.value !== "")

        try {
            const formData = new URLSearchParams()
            filtered.forEach(f => formData.append(f.name, f.value))
            formData.append("hs_context", JSON.stringify({
                hutk: hutk || undefined,
                pageUri: window.location.href,
                pageName: document.title,
            }))
            await fetch(
                `https://forms.hubspot.com/uploads/form/v2/${PORTAL_ID}/${FORM_ID}`,
                {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData.toString(),
                }
            )
            try { sessionStorage.removeItem(SESSION_KEY) } catch {}
            setStatus("success")
        } catch {
            setSubmitError("Network error. Please try again.")
            setStatus("error")
        }
    }

    // ── Styles ─────────────────────────────────────────────
    const rootStyle: React.CSSProperties = {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: ROW_GAP,
        width: "100%",
        fontFamily: FONT,
        ...style,
    }
    const rowStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "row",
        gap: COL_GAP,
        width: "100%",
        alignItems: "stretch",
    }
    const borderColor = emailError
        ? BORDER_ERROR
        : focused
          ? BORDER_FOCUS
          : BORDER_DEFAULT
    const inputStyle: React.CSSProperties = {
        flex: "1 1 auto",
        minWidth: 0,
        height: INPUT_HEIGHT,
        padding: `0 ${INPUT_PADDING_X}px`,
        fontFamily: FONT,
        fontSize: INPUT_SIZE,
        lineHeight: INPUT_LINE_HEIGHT,
        color: INPUT_TEXT_COLOR,
        background: INPUT_BG,
        border: `1px solid ${borderColor}`,
        borderRadius: INPUT_RADIUS,
        outline: "none",
        boxSizing: "border-box",
        transition: `border-color ${TRANSITION}`,
        appearance: "none",
        WebkitAppearance: "none",
        margin: 0,
    }
    const buttonStyle: React.CSSProperties = {
        flexShrink: 0,
        height: BUTTON_HEIGHT,
        padding: BUTTON_PADDING,
        background: hovered && status !== "loading" ? BUTTON_BG_HOVER : BUTTON_BG,
        color: BUTTON_TEXT_COLOR,
        fontFamily: FONT,
        fontSize: BUTTON_SIZE,
        lineHeight: BUTTON_LINE_HEIGHT,
        letterSpacing: "0em",
        fontWeight: 400,
        borderRadius: BUTTON_RADIUS,
        border: "none",
        cursor: status === "loading" ? "wait" : "pointer",
        transition: `background ${TRANSITION}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
    }
    const captionStyle: React.CSSProperties = {
        fontFamily: FONT,
        fontSize: CAPTION_SIZE,
        lineHeight: CAPTION_LINE_HEIGHT,
        color: CAPTION_COLOR,
        textAlign: "right",
        margin: 0,
        width: "100%",
    }
    const errorStyle: React.CSSProperties = {
        fontFamily: FONT,
        fontSize: 12,
        lineHeight: "1.4em",
        color: BORDER_ERROR,
        margin: 0,
    }
    const successStyle: React.CSSProperties = {
        fontFamily: FONT,
        fontSize: INPUT_SIZE,
        lineHeight: "1.4em",
        color: INPUT_TEXT_COLOR,
        margin: 0,
        padding: `${(INPUT_HEIGHT - 20) / 2}px 0`,
    }

    // ── Render ─────────────────────────────────────────────
    if (status === "success") {
        return (
            <div className={FORM_CLASS} style={rootStyle}>
                <p style={successStyle}>{successMessage}</p>
            </div>
        )
    }

    return (
        <div className={FORM_CLASS} style={rootStyle}>
            <div style={rowStyle}>
                <input
                    type="email"
                    placeholder={placeholder}
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError("")
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
                    style={inputStyle}
                    autoComplete="email"
                    aria-label="Email address"
                    required
                />
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === "loading"}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={buttonStyle}
                >
                    {status === "loading" ? <span className="cogent-spinner" /> : buttonLabel}
                </button>
            </div>

            {emailError && <div style={errorStyle}>{emailError}</div>}
            {submitError && <div style={errorStyle}>{submitError}</div>}

            <p className="cogent-caption" style={captionStyle}>
                {captionText}
                {captionLinkLabel ? (
                    <>
                        {" "}
                        <a href={captionLinkUrl || "#"} target="_blank" rel="noopener noreferrer">
                            {captionLinkLabel}
                        </a>
                    </>
                ) : null}
            </p>
        </div>
    )
}

CogentNewsletterForm.displayName = "Cogent Newsletter Form"

// ── Property Controls ─────────────────────────────────────
addPropertyControls(CogentNewsletterForm, {
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Enter your email",
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button Label",
        defaultValue: "Subscribe",
    },
    cidValue: {
        type: ControlType.String,
        title: "CID",
        defaultValue: "",
        placeholder: "Campaign ID (optional)",
    },
    captionText: {
        type: ControlType.String,
        title: "Caption",
        defaultValue: "By subscribing you’re confirming you agree with our",
        displayTextArea: true,
    },
    captionLinkLabel: {
        type: ControlType.String,
        title: "Link Label",
        defaultValue: "Terms & Conditions",
    },
    captionLinkUrl: {
        type: ControlType.Link,
        title: "Link URL",
    },
    successMessage: {
        type: ControlType.String,
        title: "Success Message",
        defaultValue: "Thanks for subscribing!",
        displayTextArea: true,
    },
})
