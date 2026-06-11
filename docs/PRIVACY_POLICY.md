# Privacy Policy

**Effective date:** June 11, 2026  
**Applies to:** 13.13 Browser desktop application (version 1.0 and later)

This Privacy Policy describes how **13.13 Browser** (“the application”, “we”,
“our”) handles information when you use the software. 13.13 Browser is designed
so that **browsing data stays on your device by default** and **no usage
telemetry is collected by the application itself**.

If you have questions about this policy, contact the project maintainers through
the repository’s issue tracker or your distribution channel.

---

## Summary

| Topic | Our approach |
|-------|----------------|
| Account required | No |
| Usage analytics by 13.13 Browser | None |
| Browsing history sent to us | No |
| Data storage | Local on your computer |
| Private tabs | Ephemeral — not saved after close |
| Third-party websites | Governed by their own policies |
| Default search | DuckDuckGo (only when you search) |

---

## 1. Information the application stores locally

13.13 Browser saves certain data on your device using Electron’s user data
directory (typically `%APPDATA%/13-13-browser` or equivalent on your OS).

### 1.1 Normal browsing session

When you use regular (non-private) tabs, the application may store:

- **Cookies, cache, and web storage** for sites you visit (standard browser behavior)
- **Session restore data** — URLs of open normal tabs so they can be reopened after restart (`session.json`)
- **Bookmarks** you create (`bookmarks.json`)
- **Privacy settings** such as tracker blocking and clear-on-exit preferences (`privacy-settings.json`)

This data remains on your device unless you delete it or enable **Clear data on
exit** in the Privacy panel.

### 1.2 Private tabs

Private tabs use a **separate, in-memory session partition** per tab. When a
private tab or the browser window is closed, that session’s cookies, cache, and
storage are **not retained** and are **not included in session restore**.

### 1.3 Privacy statistics

The Privacy dashboard shows **local counters** only (for example, number of
tracker requests blocked and permissions denied during the current session).
These statistics are **not transmitted** to us or any third party.

---

## 2. Information we do not collect

13.13 Browser **does not**:

- Require registration or an account
- Collect analytics, crash reports, or telemetry by default
- Upload your browsing history, bookmarks, or page content to our servers
- Fingerprint your device for advertising purposes
- Sell or share your personal information

We do not operate backend services that receive your browsing activity as part
of normal application use.

---

## 3. Network activity

### 3.1 Websites you visit

When you navigate to a website, your device connects to that site and any
resources it loads (images, scripts, APIs, etc.) according to standard web
protocols. Those third parties may collect information under **their own privacy
policies**. 13.13 Browser is not responsible for third-party data practices.

### 3.2 Default search

If you enter text that is not recognized as a URL in the address bar or new tab
page search box, the application may send your query to **DuckDuckGo**
(`https://duckduckgo.com/`). That request is made **directly from your device**
to DuckDuckGo and is subject to [DuckDuckGo’s privacy policy](https://duckduckgo.com/privacy).

You can avoid this by entering full URLs (e.g. `https://example.com`).

### 3.3 Tracker blocking

When **Block trackers** is enabled (default: on), the application may **cancel
network requests** to a built-in list of known analytics and advertising
domains before they leave your device. Blocked requests are not sent to us;
blocking happens locally in the Electron session.

### 3.4 Do Not Track

When enabled (default: on), the application adds a `DNT: 1` header to outgoing
requests. Not all websites honor this signal.

---

## 4. Permissions

When **Block sensitive permissions** is enabled (default: on), the application
denies site requests for sensitive capabilities by default, including camera,
microphone, geolocation, and notifications. You may change this setting in the
Privacy panel.

---

## 5. Screen-capture protection

On supported platforms, the application can exclude its window from screen
capture and sharing (for example, OBS or Snipping Tool on Windows 10 2004+).
This is an OS-level feature toggled in the application; it does not transmit data
externally.

---

## 6. Clearing your data

You can remove locally stored browsing data at any time:

- **Privacy panel → Clear browsing data** — wipes cache and web storage
- **Clear data on exit** — optional automatic wipe when closing the browser
- **Uninstalling** the application may leave user data in the user data folder
  until you delete that folder manually

---

## 7. Children’s privacy

13.13 Browser is not directed at children under 13. We do not knowingly collect
personal information from children.

---

## 8. International users

Data processed by the application is stored and handled on your local device.
Third-party websites you visit may transfer data across borders according to
their own policies.

---

## 9. Changes to this policy

We may update this Privacy Policy when features or data practices change.
Material updates will be reflected in the repository and noted in
[CHANGELOG.md](../CHANGELOG.md). Continued use after an update constitutes
acceptance of the revised policy.

---

## 10. Your rights

Because data is stored locally, you control it directly: delete bookmarks,
clear browsing data, use private tabs, adjust privacy settings, or remove the
application and its user data folder.

If local privacy laws grant you additional rights regarding data held by third
parties you visit through the browser, you must exercise those rights with those
parties directly.

---

## 11. Disclaimer

13.13 Browser provides privacy **tools and defaults**, not guaranteed anonymity.
Private tabs isolate local sessions but do not route traffic through Tor or VPN
unless you configure external tools yourself. No browser can protect against all
forms of tracking, malware, or physical access to your device.

---

## 12. Contact

For privacy-related questions or to report a concern about this policy, open an
issue in the project repository or contact the maintainers through your
distribution channel.

For security vulnerabilities, follow [SECURITY.md](../SECURITY.md) instead of
public issues.
