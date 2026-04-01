import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect, useRef, startTransition, type CSSProperties } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldKind = "fullname" | "email" | "dropdown" | "textarea" | "checkbox" | "text"

interface ParsedField {
    qid: string
    kind: FieldKind
    label: string
    required: boolean
    // Simple inputs (email, textarea, text, dropdown, checkbox)
    fieldName?: string
    placeholder?: string
    options?: string[]         // dropdown
    checkboxValue?: string     // checkbox
    // Fullname pair
    firstFieldName?: string
    lastFieldName?: string
    firstLabel?: string
    lastLabel?: string
}

interface FormStructure {
    fields: ParsedField[]
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function extractExtras(html: string): any[] {
    const marker = "JotForm.paymentExtrasOnTheFly("
    const start = html.indexOf(marker)
    if (start === -1) return []
    const arrayStart = html.indexOf("[", start + marker.length)
    if (arrayStart === -1) return []
    let depth = 0, end = -1
    for (let i = arrayStart; i < html.length; i++) {
        if (html[i] === "[") depth++
        else if (html[i] === "]") { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) return []
    try { return JSON.parse(html.slice(arrayStart, end + 1)) } catch { return [] }
}

function parseFormHTML(html: string): FormStructure {
    const rawFields = extractExtras(html)
    const doc = new DOMParser().parseFromString(html, "text/html")

    const raw: ParsedField[] = []

    for (const f of rawFields) {
        if (!f || !f.type) continue
        const { qid, name, text, type } = f
        if (type === "control_head" || type === "control_button") continue

        const required = !!doc.querySelector(`#cid_${qid} .validate\\[required\\], [id$="${qid}"][required]`)
            || !!doc.querySelector(`#id_${qid}.jf-required`)

        if (type === "control_fullname") {
            const firstEl = doc.querySelector(`#first_${qid}`) as HTMLInputElement | null
            const lastEl  = doc.querySelector(`#last_${qid}`)  as HTMLInputElement | null
            const firstLabel = doc.querySelector(`#sublabel_${qid}_first`)?.textContent?.trim() || "First Name"
            const lastLabel  = doc.querySelector(`#sublabel_${qid}_last`)?.textContent?.trim()  || "Last Name"
            raw.push({
                qid, kind: "fullname", label: text, required: true,
                firstFieldName: firstEl?.name || `q${qid}_${name}[first]`,
                lastFieldName:  lastEl?.name  || `q${qid}_${name}[last]`,
                firstLabel, lastLabel,
            })
        } else if (type === "control_email") {
            const el = doc.querySelector(`#input_${qid}`) as HTMLInputElement | null
            raw.push({
                qid, kind: "email", label: text, required: true,
                fieldName: el?.name || `q${qid}_${name}`,
                placeholder: f.subLabel || "example@example.com",
            })
        } else if (type === "control_dropdown") {
            const el = doc.querySelector(`#input_${qid}`) as HTMLSelectElement | null
            const options: string[] = []
            el?.querySelectorAll("option").forEach(o => { if (o.value) options.push(o.value) })
            raw.push({
                qid, kind: "dropdown", label: text, required: true,
                fieldName: el?.name || `q${qid}_${name}`,
                options,
            })
        } else if (type === "control_textarea") {
            const el = doc.querySelector(`#input_${qid}`) as HTMLTextAreaElement | null
            raw.push({
                qid, kind: "textarea", label: text, required: true,
                fieldName: el?.name || `q${qid}_${name}`,
                placeholder: f.subLabel || "",
            })
        } else if (type === "control_checkbox") {
            const el = doc.querySelector(`#input_${qid}_0`) as HTMLInputElement | null
            raw.push({
                qid, kind: "checkbox", label: text, required: true,
                fieldName: el?.name || `q${qid}_${name}[]`,
                checkboxValue: el?.value || "I agree",
            })
        } else if (type === "control_textbox") {
            const el = doc.querySelector(`#input_${qid}`) as HTMLInputElement | null
            raw.push({
                qid, kind: "text", label: text, required: false,
                fieldName: el?.name || `q${qid}_${name}`,
                placeholder: f.subLabel || "",
            })
        }
    }

    // Merge consecutive fullname pairs into a single side-by-side row.
    // e.g. "First name" (fullname) + "Last name" (fullname) → one row.
    const fields: ParsedField[] = []
    let i = 0
    while (i < raw.length) {
        const curr = raw[i]
        const next = raw[i + 1]
        if (
            curr.kind === "fullname" && next?.kind === "fullname" &&
            /first/i.test(curr.label) && /last/i.test(next.label)
        ) {
            // Merge: use curr[first] + next[last] (or next[first] if last not available)
            fields.push({
                qid: `${curr.qid}_${next.qid}`,
                kind: "fullname",
                label: "",
                required: true,
                firstFieldName: curr.firstFieldName,
                lastFieldName:  next.lastFieldName || next.firstFieldName,
                firstLabel: curr.label,
                lastLabel:  next.label,
            })
            i += 2
        } else {
            fields.push(curr)
            i++
        }
    }

    return { fields }
}

async function loadForm(formId: string): Promise<FormStructure> {
    const url = `https://form.jotform.com/${formId}`
    // Try corsproxy first, fall back to allorigins
    for (const proxy of [
        `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    ]) {
        try {
            const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) })
            if (!res.ok) continue
            let html: string
            if (proxy.includes("allorigins")) {
                const json = await res.json()
                html = json.contents
            } else {
                html = await res.text()
            }
            const structure = parseFormHTML(html)
            if (structure.fields.length > 0) return structure
        } catch { /* try next proxy */ }
    }
    throw new Error("Could not load form. Check the form ID and make sure the form is public.")
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drop in a JotForm by ID — fields, labels, and options are auto-detected.
 * Style everything from the property panel.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 680
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function JotFormContact(props: Props) {
    const {
        style,
        formId,
        labelFont, inputFont, buttonFont,
        labelColor, formBg, inputBg,
        inputBorderColor, inputFocusBorderColor,
        inputTextColor, placeholderColor,
        buttonBg, buttonTextColor, buttonHoverBg, errorColor,
        borderRadius, inputPaddingV, inputPaddingH, formGap,
        submitButtonText, showSuccessMessage, successMessage,
    } = props

    const [structure, setStructure] = useState<FormStructure | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [values, setValues]   = useState<Record<string, string | boolean>>({})
    const [errors, setErrors]   = useState<Record<string, string>>({})
    const [focused, setFocused] = useState<string | null>(null)
    const [btnHover, setBtnHover] = useState(false)
    const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle")
    const lastId = useRef<string>("")

    useEffect(() => {
        const id = formId?.trim()
        if (!id || id === lastId.current) return
        lastId.current = id
        setStructure(null)
        setLoadError(null)
        setValues({})
        setErrors({})
        setStatus("idle")
        loadForm(id)
            .then(s => startTransition(() => setStructure(s)))
            .catch(e => startTransition(() => setLoadError(e.message)))
    }, [formId])

    function setField(key: string, value: string | boolean) {
        startTransition(() => {
            setValues(prev => ({ ...prev, [key]: value }))
            if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
        })
    }

    function validate(fields: ParsedField[]) {
        const e: Record<string, string> = {}
        for (const f of fields) {
            if (!f.required) continue
            if (f.kind === "fullname") {
                if (!String(values[f.firstFieldName!] ?? "").trim()) e[f.firstFieldName!] = "Required"
                if (!String(values[f.lastFieldName!]  ?? "").trim()) e[f.lastFieldName!]  = "Required"
            } else if (f.kind === "email") {
                const v = String(values[f.fieldName!] ?? "").trim()
                if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) e[f.fieldName!] = "Enter a valid email"
            } else if (f.kind === "checkbox") {
                if (!values[f.fieldName!]) e[f.fieldName!] = "Required"
            } else {
                if (!String(values[f.fieldName!] ?? "").trim()) e[f.fieldName!] = "Required"
            }
        }
        return e
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!structure) return
        const errs = validate(structure.fields)
        startTransition(() => setErrors(errs))
        if (Object.keys(errs).length > 0) return
        startTransition(() => setStatus("loading"))

        const id = formId.trim()
        const data = new FormData()
        data.append("formID", id)
        for (const f of structure.fields) {
            if (f.kind === "fullname") {
                data.append(f.firstFieldName!, String(values[f.firstFieldName!] ?? ""))
                data.append(f.lastFieldName!,  String(values[f.lastFieldName!]  ?? ""))
            } else if (f.kind === "checkbox") {
                if (values[f.fieldName!]) data.append(f.fieldName!, f.checkboxValue!)
            } else {
                data.append(f.fieldName!, String(values[f.fieldName!] ?? ""))
            }
        }
        data.append("simple_spc", `${id}-${id}`)
        data.append("submitSource", "embed")
        data.append("submitDate", new Date().toISOString())

        try {
            await fetch(`https://submit.jotform.com/submit/${id}`, {
                method: "POST", body: data, mode: "no-cors",
            })
            startTransition(() => setStatus("success"))
        } catch {
            startTransition(() => setStatus("error"))
        }
    }

    // ── Style helpers ────────────────────────────────────────────────────────

    const inputS = (key: string): CSSProperties => ({
        display: "block", width: "100%", boxSizing: "border-box",
        background: inputBg,
        border: `1px solid ${focused === key ? inputFocusBorderColor : errors[key] ? errorColor : inputBorderColor}`,
        borderRadius, padding: `${inputPaddingV}px ${inputPaddingH}px`,
        color: inputTextColor, outline: "none",
        transition: "border-color 0.15s ease",
        ...inputFont, WebkitAppearance: "none", appearance: "none",
    })

    const labelS: CSSProperties  = { display: "block", marginBottom: 6, color: labelColor, ...labelFont }
    const errorS: CSSProperties  = { marginTop: 4, fontSize: 12, color: errorColor, ...labelFont, fontWeight: 400 }
    const fieldS: CSSProperties  = { display: "flex", flexDirection: "column" }

    // ── States ───────────────────────────────────────────────────────────────

    const containerStyle: CSSProperties = {
        position: "relative", background: formBg, width: "100%",
        boxSizing: "border-box", ...style,
    }

    if (!formId?.trim()) {
        return (
            <div style={{ ...containerStyle, padding: 24, color: "rgba(0,0,0,0.4)", ...labelFont }}>
                Enter a JotForm ID in the property panel.
            </div>
        )
    }

    if (loadError) {
        return (
            <div style={{ ...containerStyle, padding: 24 }}>
                <p style={{ margin: 0, color: errorColor, ...labelFont }}>{loadError}</p>
            </div>
        )
    }

    if (!structure) {
        return (
            <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: formGap, padding: "2px 0" }}>
                {[80, 60, 60, 60, 100, 40, 44].map((h, i) => (
                    <div key={i} style={{
                        height: h, borderRadius, background: "rgba(0,0,0,0.06)",
                        animation: "jf-pulse 1.4s ease-in-out infinite",
                        animationDelay: `${i * 0.08}s`,
                    }} />
                ))}
                <style>{`@keyframes jf-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
            </div>
        )
    }

    if (status === "success" && showSuccessMessage) {
        return (
            <div style={{ ...containerStyle, borderRadius, padding: `${inputPaddingV * 3}px ${inputPaddingH * 2}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 160, textAlign: "center" }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill={buttonBg} opacity={0.12} />
                    <path d="M13 20l5 5 9-9" stroke={buttonBg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ margin: 0, color: inputTextColor, ...labelFont }}>{successMessage}</p>
            </div>
        )
    }

    // ── Field renderers ──────────────────────────────────────────────────────

    function renderField(f: ParsedField) {
        if (f.kind === "fullname") {
            return (
                <div key={f.qid} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: formGap }}>
                    {[
                        { key: f.firstFieldName!, label: f.firstLabel!, ph: "e.g. John" },
                        { key: f.lastFieldName!,  label: f.lastLabel!,  ph: "e.g. Doe"  },
                    ].map(({ key, label, ph }) => (
                        <div key={key} style={fieldS}>
                            <label style={labelS}>{label} *</label>
                            <input
                                type="text" placeholder={ph}
                                value={String(values[key] ?? "")}
                                onChange={e => setField(key, e.target.value)}
                                onFocus={() => startTransition(() => setFocused(key))}
                                onBlur={() => startTransition(() => setFocused(null))}
                                style={inputS(key)}
                            />
                            {errors[key] && <span style={errorS}>{errors[key]}</span>}
                        </div>
                    ))}
                </div>
            )
        }

        if (f.kind === "email") {
            return (
                <div key={f.qid} style={fieldS}>
                    <label style={labelS}>{f.label} *</label>
                    <input
                        type="email" placeholder={f.placeholder}
                        value={String(values[f.fieldName!] ?? "")}
                        onChange={e => setField(f.fieldName!, e.target.value)}
                        onFocus={() => startTransition(() => setFocused(f.fieldName!))}
                        onBlur={() => startTransition(() => setFocused(null))}
                        style={inputS(f.fieldName!)}
                    />
                    {errors[f.fieldName!] && <span style={errorS}>{errors[f.fieldName!]}</span>}
                </div>
            )
        }

        if (f.kind === "dropdown") {
            const key = f.fieldName!
            return (
                <div key={f.qid} style={fieldS}>
                    <label style={labelS}>{f.label} *</label>
                    <div style={{ position: "relative" }}>
                        <select
                            value={String(values[key] ?? "")}
                            onChange={e => setField(key, e.target.value)}
                            onFocus={() => startTransition(() => setFocused(key))}
                            onBlur={() => startTransition(() => setFocused(null))}
                            style={{
                                ...inputS(key), cursor: "pointer",
                                paddingRight: inputPaddingH + 28,
                                color: values[key] ? inputTextColor : placeholderColor,
                            }}
                        >
                            <option value="" disabled hidden>Please select</option>
                            {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", right: inputPaddingH, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }}>
                            <path d="M4 6l4 4 4-4" stroke={inputTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    {errors[key] && <span style={errorS}>{errors[key]}</span>}
                </div>
            )
        }

        if (f.kind === "textarea") {
            const key = f.fieldName!
            return (
                <div key={f.qid} style={fieldS}>
                    <label style={labelS}>{f.label} *</label>
                    <textarea
                        placeholder={f.placeholder || "Tell us more…"}
                        value={String(values[key] ?? "")}
                        onChange={e => setField(key, e.target.value)}
                        onFocus={() => startTransition(() => setFocused(key))}
                        onBlur={() => startTransition(() => setFocused(null))}
                        rows={5}
                        style={{ ...inputS(key), resize: "vertical", minHeight: 120 }}
                    />
                    {errors[key] && <span style={errorS}>{errors[key]}</span>}
                </div>
            )
        }

        if (f.kind === "checkbox") {
            const key = f.fieldName!
            const checked = !!values[key]
            return (
                <div key={f.qid} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                        <span style={{
                            flexShrink: 0, width: 18, height: 18, marginTop: 1,
                            borderRadius: Math.min(borderRadius as number, 4),
                            border: `1.5px solid ${checked ? buttonBg : errors[key] ? errorColor : inputBorderColor}`,
                            background: checked ? buttonBg : inputBg,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s ease",
                        }}>
                            {checked && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2.5 2.5L8 3" stroke={buttonTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </span>
                        <input type="checkbox" checked={checked} onChange={e => setField(key, e.target.checked)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                        <span style={{ ...labelFont, color: labelColor, lineHeight: "1.4" }}>{f.label} *</span>
                    </label>
                    {errors[key] && <span style={{ ...errorS, marginLeft: 28 }}>{errors[key]}</span>}
                </div>
            )
        }

        // text fallback
        const key = f.fieldName!
        return (
            <div key={f.qid} style={fieldS}>
                <label style={labelS}>{f.label}{f.required ? " *" : ""}</label>
                <input
                    type="text" placeholder={f.placeholder}
                    value={String(values[key] ?? "")}
                    onChange={e => setField(key, e.target.value)}
                    onFocus={() => startTransition(() => setFocused(key))}
                    onBlur={() => startTransition(() => setFocused(null))}
                    style={inputS(key)}
                />
                {errors[key] && <span style={errorS}>{errors[key]}</span>}
            </div>
        )
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div style={containerStyle}>
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: formGap }}>
                {structure.fields.map(renderField)}

                <button
                    type="submit"
                    disabled={status === "loading"}
                    onMouseEnter={() => startTransition(() => setBtnHover(true))}
                    onMouseLeave={() => startTransition(() => setBtnHover(false))}
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        width: "100%", padding: `${inputPaddingV + 4}px ${inputPaddingH}px`,
                        background: btnHover && status !== "loading" ? buttonHoverBg : buttonBg,
                        color: buttonTextColor, border: "none", borderRadius,
                        cursor: status === "loading" ? "wait" : "pointer",
                        opacity: status === "loading" ? 0.7 : 1,
                        transition: "background 0.15s ease, opacity 0.15s ease",
                        ...buttonFont,
                    }}
                >
                    {status === "loading" ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "jf-spin 0.8s linear infinite" }}>
                                <circle cx="8" cy="8" r="6" stroke={buttonTextColor} strokeWidth="2" strokeOpacity="0.3" />
                                <path d="M8 2a6 6 0 0 1 6 6" stroke={buttonTextColor} strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <style>{`@keyframes jf-spin { to { transform: rotate(360deg); } }`}</style>
                            Sending…
                        </>
                    ) : status === "error" ? "Something went wrong — try again" : submitButtonText}
                </button>
            </form>
        </div>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    style?: CSSProperties
    formId: string
    labelFont: Record<string, any>
    inputFont: Record<string, any>
    buttonFont: Record<string, any>
    labelColor: string
    formBg: string
    inputBg: string
    inputBorderColor: string
    inputFocusBorderColor: string
    inputTextColor: string
    placeholderColor: string
    buttonBg: string
    buttonTextColor: string
    buttonHoverBg: string
    errorColor: string
    borderRadius: number
    inputPaddingV: number
    inputPaddingH: number
    formGap: number
    submitButtonText: string
    showSuccessMessage: boolean
    successMessage: string
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(JotFormContact, {
    formId: {
        type: ControlType.String,
        defaultValue: "260886337622060",
        title: "Form ID",
        description: "Your JotForm form ID. Fields are loaded automatically.",
    },
    labelFont: {
        type: ControlType.Font, controls: "extended", defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Medium", lineHeight: "1.4em" },
        title: "Label Font",
    },
    inputFont: {
        type: ControlType.Font, controls: "extended", defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Regular", lineHeight: "1.5em" },
        title: "Input Font",
    },
    buttonFont: {
        type: ControlType.Font, controls: "extended", defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Medium", lineHeight: "1.5em" },
        title: "Button Font",
    },
    labelColor: { type: ControlType.Color, defaultValue: "rgba(0,0,0,0.7)", title: "Label Color" },
    formBg: { type: ControlType.Color, defaultValue: "transparent", title: "Form Background" },
    inputBg: { type: ControlType.Color, defaultValue: "#ffffff", title: "Input Background" },
    inputBorderColor: { type: ControlType.Color, defaultValue: "rgba(0,0,0,0.15)", title: "Input Border" },
    inputFocusBorderColor: { type: ControlType.Color, defaultValue: "rgba(0,0,0,0.6)", title: "Focus Border" },
    inputTextColor: { type: ControlType.Color, defaultValue: "#111111", title: "Input Text" },
    placeholderColor: { type: ControlType.Color, defaultValue: "rgba(0,0,0,0.3)", title: "Placeholder" },
    buttonBg: { type: ControlType.Color, defaultValue: "#111111", title: "Button BG" },
    buttonHoverBg: { type: ControlType.Color, defaultValue: "#333333", title: "Button Hover BG" },
    buttonTextColor: { type: ControlType.Color, defaultValue: "#ffffff", title: "Button Text" },
    errorColor: { type: ControlType.Color, defaultValue: "#e53e3e", title: "Error Color" },
    borderRadius: { type: ControlType.Number, defaultValue: 8, min: 0, max: 24, step: 1, displayStepper: true, title: "Border Radius" },
    inputPaddingV: { type: ControlType.Number, defaultValue: 11, min: 6, max: 24, step: 1, displayStepper: true, title: "Input Padding V" },
    inputPaddingH: { type: ControlType.Number, defaultValue: 14, min: 8, max: 32, step: 1, displayStepper: true, title: "Input Padding H" },
    formGap: { type: ControlType.Number, defaultValue: 20, min: 8, max: 48, step: 2, displayStepper: true, title: "Field Gap" },
    submitButtonText: { type: ControlType.String, defaultValue: "Submit inquiry", title: "Button Label" },
    showSuccessMessage: { type: ControlType.Boolean, defaultValue: true, title: "Show Success State" },
    successMessage: {
        type: ControlType.String, defaultValue: "Thanks! We'll be in touch soon.",
        title: "Success Message", hidden: (p) => !p.showSuccessMessage,
    },
})
