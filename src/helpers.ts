type RequiredKeysResponse = string;

export const getProofWaxRequiredKeys = async (
  rpcUrl: string
): Promise<RequiredKeysResponse> => {
  const response = await fetch(`${rpcUrl}/v1/chain/get_account`, {
    body: JSON.stringify({
      account_name: "proof.wax",
    }),
    method: "POST",
  });

  if (!response.ok) {
    // Handle non-successful HTTP responses (e.g., 404 Not Found, 500 Internal Server Error)
    console.error(`HTTP error! Status: ${response.status}`);
  } else {
    const responseData = await response.json();

    if (responseData.permissions) {
      for (const perm of responseData.permissions) {
        if (perm.perm_name === "active") {
          return perm.required_auth.keys[0].key;
        }
      }
    }
  }

  throw new Error(
    "Unable to retrieve the WAX proof key for account verification"
  );
};

const unsecuredCopyToClipboard = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Unable to copy to clipboard", err);
  }
  document.body.removeChild(textArea);
};

/**
 * Copies the text passed as param to the system clipboard
 * Check if using HTTPS and navigator.clipboard is available
 * Then uses standard clipboard API, otherwise uses fallback
 */
export const copyToClipboard = (content: string) => {
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(content);
  } else {
    unsecuredCopyToClipboard(content);
  }
  const toast = document.getElementById("activation-toast");
  if (!toast) return;
  toast.style.display = "block";
  toast.textContent = "Link copied";
  setTimeout(() => {
    toast.style.display = "none";
  }, 1600);
};

export const createFlexDiv = (
  direction: "row" | "column" = "row",
  gap: string = "0px"
) => {
  const div: HTMLDivElement = document.createElement("div");
  div.style.display = "flex";
  div.style.flexDirection = direction;
  div.style.gap = gap;
  return div;
};

export const createButton = (id: string, text: string) => {
  const element = createFlexDiv("row", "8px");
  element.id = id;
  element.textContent = text;
  element.style.color = "#FFFFFF";
  element.style.cursor = "pointer";
  element.style.fontWeight = "700";
  element.style.fontSize = "14px";
  element.style.textTransform = "uppercase";
  element.style.padding = "16px 30px";
  element.style.borderRadius = "12px";
  element.style.background = "#8549B6";
  element.style.justifyContent = "center";
  element.style.alignItems = "center";
  return element;
};

export const createTextWithIcon = (text: string, icon: Node) => {
  const div = createFlexDiv("row", "8px");
  div.style.alignItems = "center";
  const textElement = document.createElement("span");
  textElement.textContent = text;
  textElement.style.fontWeight = "600";

  div.appendChild(icon);
  div.appendChild(textElement);
  return div;
};

export const createLoadingSection = (id?: string) => {
  const div = createFlexDiv("column", "24px");
  div.id = id;
  div.style.alignItems = "center";
  div.style.width = "100%";
  div.style.padding = "24px";
  div.style.borderRadius = "24px";
  div.style.background = "#F5F4FF";
  div.style.boxSizing = "border-box";

  const loadingIcon = createLoadingIcon();

  const textElement = document.createElement("span");
  textElement.textContent = "Loading...";
  textElement.style.fontWeight = "400";
  textElement.style.color = "#4C4779";

  div.appendChild(loadingIcon);
  div.appendChild(textElement);
  return div;
};

export const createMobileIcon = () => {
  const element = createFlexDiv("row");
  element.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M17.4375 1.45312H6.5625C5.73516 1.45312 5.0625 2.12578 5.0625 2.95312V20.9531C5.0625 21.7805 5.73516 22.4531 6.5625 22.4531H17.4375C18.2648 22.4531 18.9375 21.7805 18.9375 20.9531V2.95312C18.9375 2.12578 18.2648 1.45312 17.4375 1.45312ZM17.25 20.7656H6.75V3.14062H17.25V20.7656ZM11.0625 18.375C11.0625 18.6236 11.1613 18.8621 11.3371 19.0379C11.5129 19.2137 11.7514 19.3125 12 19.3125C12.2486 19.3125 12.4871 19.2137 12.6629 19.0379C12.8387 18.8621 12.9375 18.6236 12.9375 18.375C12.9375 18.1264 12.8387 17.8879 12.6629 17.7121C12.4871 17.5363 12.2486 17.4375 12 17.4375C11.7514 17.4375 11.5129 17.5363 11.3371 17.7121C11.1613 17.8879 11.0625 18.1264 11.0625 18.375Z" fill="#363448"/>
  </svg>`;
  return element;
};

export const createDesktopIcon = () => {
  const element = createFlexDiv("row");
  element.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
<path d="M21.75 3.28125H2.25C1.83516 3.28125 1.5 3.61641 1.5 4.03125V15.6562C1.5 16.0711 1.83516 16.4062 2.25 16.4062H11.1562V19.0312H7.125C6.91875 19.0312 6.75 19.2 6.75 19.4062V20.5312C6.75 20.6344 6.83437 20.7188 6.9375 20.7188H17.0625C17.1656 20.7188 17.25 20.6344 17.25 20.5312V19.4062C17.25 19.2 17.0813 19.0312 16.875 19.0312H12.8438V16.4062H21.75C22.1648 16.4062 22.5 16.0711 22.5 15.6562V4.03125C22.5 3.61641 22.1648 3.28125 21.75 3.28125ZM20.8125 14.7188H3.1875V4.96875H20.8125V14.7188Z" fill="#363448"/>
</svg>`;
  return element;
};

export const createScanIcon = () => {
  const element = createFlexDiv("row");
  element.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M3.1875 9H4.5C4.60312 9 4.6875 8.91563 4.6875 8.8125V4.6875H8.8125C8.91563 4.6875 9 4.60312 9 4.5V3.1875C9 3.08437 8.91563 3 8.8125 3H4.59375C3.7125 3 3 3.7125 3 4.59375V8.8125C3 8.91563 3.08437 9 3.1875 9ZM15.1875 4.6875H19.3125V8.8125C19.3125 8.91563 19.3969 9 19.5 9H20.8125C20.9156 9 21 8.91563 21 8.8125V4.59375C21 3.7125 20.2875 3 19.4062 3H15.1875C15.0844 3 15 3.08437 15 3.1875V4.5C15 4.60312 15.0844 4.6875 15.1875 4.6875ZM8.8125 19.3125H4.6875V15.1875C4.6875 15.0844 4.60312 15 4.5 15H3.1875C3.08437 15 3 15.0844 3 15.1875V19.4062C3 20.2875 3.7125 21 4.59375 21H8.8125C8.91563 21 9 20.9156 9 20.8125V19.5C9 19.3969 8.91563 19.3125 8.8125 19.3125ZM20.8125 15H19.5C19.3969 15 19.3125 15.0844 19.3125 15.1875V19.3125H15.1875C15.0844 19.3125 15 19.3969 15 19.5V20.8125C15 20.9156 15.0844 21 15.1875 21H19.4062C20.2875 21 21 20.2875 21 19.4062V15.1875C21 15.0844 20.9156 15 20.8125 15ZM21.1875 11.1562H2.8125C2.70937 11.1562 2.625 11.2406 2.625 11.3438V12.6562C2.625 12.7594 2.70937 12.8438 2.8125 12.8438H21.1875C21.2906 12.8438 21.375 12.7594 21.375 12.6562V11.3438C21.375 11.2406 21.2906 11.1562 21.1875 11.1562Z" fill="#7A7A7A"/>
</svg>`;
  return element;
};

export const createLoadingIcon = () => {
  const element = document.createElement("img");
  element.style.width = "64px";
  element.src = `data:image/svg+xml;base64,77u/PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyMDAgMjAwJz48cmFkaWFsR3JhZGllbnQgaWQ9J2ExMicgY3g9Jy42NicgZng9Jy42NicgY3k9Jy4zMTI1JyBmeT0nLjMxMjUnIGdyYWRpZW50VHJhbnNmb3JtPSdzY2FsZSgxLjUpJz48c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyM4NDRBQjYnPjwvc3RvcD48c3RvcCBvZmZzZXQ9Jy4zJyBzdG9wLWNvbG9yPScjODQ0QUI2JyBzdG9wLW9wYWNpdHk9Jy45Jz48L3N0b3A+PHN0b3Agb2Zmc2V0PScuNicgc3RvcC1jb2xvcj0nIzg0NEFCNicgc3RvcC1vcGFjaXR5PScuNic+PC9zdG9wPjxzdG9wIG9mZnNldD0nLjgnIHN0b3AtY29sb3I9JyM4NDRBQjYnIHN0b3Atb3BhY2l0eT0nLjMnPjwvc3RvcD48c3RvcCBvZmZzZXQ9JzEnIHN0b3AtY29sb3I9JyM4NDRBQjYnIHN0b3Atb3BhY2l0eT0nMCc+PC9zdG9wPjwvcmFkaWFsR3JhZGllbnQ+PGNpcmNsZSB0cmFuc2Zvcm0tb3JpZ2luPSdjZW50ZXInIGZpbGw9J25vbmUnIHN0cm9rZT0ndXJsKCNhMTIpJyBzdHJva2Utd2lkdGg9JzE2JyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1kYXNoYXJyYXk9JzIwMCAxMDAwJyBzdHJva2UtZGFzaG9mZnNldD0nMCcgY3g9JzEwMCcgY3k9JzEwMCcgcj0nNzAnPjxhbmltYXRlVHJhbnNmb3JtIHR5cGU9J3JvdGF0ZScgYXR0cmlidXRlTmFtZT0ndHJhbnNmb3JtJyBjYWxjTW9kZT0nc3BsaW5lJyBkdXI9JzInIHZhbHVlcz0nMzYwOzAnIGtleVRpbWVzPScwOzEnIGtleVNwbGluZXM9JzAgMCAxIDEnIHJlcGVhdENvdW50PSdpbmRlZmluaXRlJz48L2FuaW1hdGVUcmFuc2Zvcm0+PC9jaXJjbGU+PGNpcmNsZSB0cmFuc2Zvcm0tb3JpZ2luPSdjZW50ZXInIGZpbGw9J25vbmUnIG9wYWNpdHk9Jy4yJyBzdHJva2U9JyM4NDRBQjYnIHN0cm9rZS13aWR0aD0nMTYnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgY3g9JzEwMCcgY3k9JzEwMCcgcj0nNzAnPjwvY2lyY2xlPjwvc3ZnPg==`;
  return element;
};

export const createInfoIcon = () => {
  const element = createFlexDiv("row");
  element.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
  <path d="M12.5 1.5C6.70156 1.5 2 6.20156 2 12C2 17.7984 6.70156 22.5 12.5 22.5C18.2984 22.5 23 17.7984 23 12C23 6.20156 18.2984 1.5 12.5 1.5ZM12.5 20.7188C7.68594 20.7188 3.78125 16.8141 3.78125 12C3.78125 7.18594 7.68594 3.28125 12.5 3.28125C17.3141 3.28125 21.2188 7.18594 21.2188 12C21.2188 16.8141 17.3141 20.7188 12.5 20.7188Z" fill="#363448"/>
  <path d="M11.375 7.875C11.375 8.17337 11.4935 8.45952 11.7045 8.6705C11.9155 8.88147 12.2016 9 12.5 9C12.7984 9 13.0845 8.88147 13.2955 8.6705C13.5065 8.45952 13.625 8.17337 13.625 7.875C13.625 7.57663 13.5065 7.29048 13.2955 7.0795C13.0845 6.86853 12.7984 6.75 12.5 6.75C12.2016 6.75 11.9155 6.86853 11.7045 7.0795C11.4935 7.29048 11.375 7.57663 11.375 7.875ZM13.0625 10.5H11.9375C11.8344 10.5 11.75 10.5844 11.75 10.6875V17.0625C11.75 17.1656 11.8344 17.25 11.9375 17.25H13.0625C13.1656 17.25 13.25 17.1656 13.25 17.0625V10.6875C13.25 10.5844 13.1656 10.5 13.0625 10.5Z" fill="#363448"/>
</svg>`;
  return element;
};

export const createExpiredIcon = () => {
  const element = createFlexDiv("row");
  element.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 1.5C6.20156 1.5 1.5 6.20156 1.5 12C1.5 17.7984 6.20156 22.5 12 22.5C17.7984 22.5 22.5 17.7984 22.5 12C22.5 6.20156 17.7984 1.5 12 1.5ZM12.75 17.0625C12.75 17.1656 12.6656 17.25 12.5625 17.25H11.4375C11.3344 17.25 11.25 17.1656 11.25 17.0625V10.6875C11.25 10.5844 11.3344 10.5 11.4375 10.5H12.5625C12.6656 10.5 12.75 10.5844 12.75 10.6875V17.0625ZM12 9C11.7056 8.99399 11.4253 8.87282 11.2192 8.6625C11.0132 8.45218 10.8977 8.16945 10.8977 7.875C10.8977 7.58055 11.0132 7.29782 11.2192 7.0875C11.4253 6.87718 11.7056 6.75601 12 6.75C12.2944 6.75601 12.5747 6.87718 12.7808 7.0875C12.9868 7.29782 13.1023 7.58055 13.1023 7.875C13.1023 8.16945 12.9868 8.45218 12.7808 8.6625C12.5747 8.87282 12.2944 8.99399 12 9Z" fill="#BA4300"/>
</svg>`;
  return element;
};

export const createCopyIcon = () => {
  const element = createFlexDiv("row");
  element.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
  <path d="M20 1.5H7.4375C7.33437 1.5 7.25 1.58437 7.25 1.6875V3C7.25 3.10312 7.33437 3.1875 7.4375 3.1875H19.0625V19.3125C19.0625 19.4156 19.1469 19.5 19.25 19.5H20.5625C20.6656 19.5 20.75 19.4156 20.75 19.3125V2.25C20.75 1.83516 20.4148 1.5 20 1.5ZM17 4.5H5C4.58516 4.5 4.25 4.83516 4.25 5.25V17.6883C4.25 17.8875 4.32969 18.0773 4.47031 18.218L8.53203 22.2797C8.58359 22.3312 8.64219 22.3734 8.70547 22.4086V22.4531H8.80391C8.88594 22.4836 8.97266 22.5 9.06172 22.5H17C17.4148 22.5 17.75 22.1648 17.75 21.75V5.25C17.75 4.83516 17.4148 4.5 17 4.5ZM8.70312 20.0672L6.68516 18.0469H8.70312V20.0672ZM16.0625 20.8125H10.2031V17.4844C10.2031 16.9664 9.78359 16.5469 9.26562 16.5469H5.9375V6.1875H16.0625V20.8125Z" fill="#363448"/>
</svg>`;
  return element;
};

export const createCloseIcon = () => {
  const svgElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgElement.setAttribute("width", "24");
  svgElement.setAttribute("height", "24");
  svgElement.setAttribute("viewBox", "0 0 24 24");
  svgElement.setAttribute("fill", "none");

  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.setAttribute(
    "d",
    "M13.2138 12L19.3661 4.66641C19.4692 4.54453 19.3825 4.35938 19.2231 4.35938H17.3528C17.2427 4.35938 17.1372 4.40859 17.0645 4.49297L11.9903 10.5422L6.91611 4.49297C6.84579 4.40859 6.74032 4.35938 6.62782 4.35938H4.75751C4.59814 4.35938 4.51142 4.54453 4.61454 4.66641L10.7669 12L4.61454 19.3336C4.59144 19.3608 4.57662 19.394 4.57184 19.4293C4.56706 19.4647 4.57252 19.5006 4.58757 19.533C4.60263 19.5653 4.62664 19.5926 4.65676 19.6117C4.68689 19.6308 4.72185 19.6408 4.75751 19.6406H6.62782C6.73798 19.6406 6.84345 19.5914 6.91611 19.507L11.9903 13.4578L17.0645 19.507C17.1349 19.5914 17.2403 19.6406 17.3528 19.6406H19.2231C19.3825 19.6406 19.4692 19.4555 19.3661 19.3336L13.2138 12Z"
  );
  pathElement.setAttribute("fill", "#7A7A7A");

  svgElement.appendChild(pathElement);
  return svgElement;
};

export const createLogoImage = () => {
  const element = document.createElement("img");
  element.src = `https://www.mycloudwallet.com/static/media/wcw_icon.7ffd1011a7a33f268fdc925aa7644508.svg`;
  return element;
};

export const createLogoIcon = () => {
  const element = document.createElement("img");
  element.style.width = "40px";
  element.src = `
  data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDIiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MiA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9Ikdyb3VwIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTEwLjkyNzEgMjQuMDcyMkM4LjY3NDQxIDIxLjgyMTUgOC42NzQ0MSAxOC4xNzQ1IDEwLjkyNzEgMTUuOTI3OEwxNi45MjI0IDkuOTM3ODFDMTkuMTc1MSA3LjY4NzA2IDIyLjgyNTMgNy42ODcwNiAyNS4wNzQgOS45Mzc4MUwyNy4xODYyIDEyLjA0ODFMMzMuMDI0OCA2LjIxNDY0TDMwLjkxMjYgNC4xMDQzMUMyNS40MzU0IC0xLjM2ODEgMTYuNTU3IC0xLjM2ODEgMTEuMDc5NyA0LjEwNDMxTDUuMDg0NDkgMTAuMDk0M0MtMC4zOTI3NDcgMTUuNTY2NyAtMC4zOTI3NDcgMjQuNDM3MyA1LjA4NDQ5IDI5LjkwOTdMNy4xODg2NSAzMi4wMTJMMTMuMDI3MyAyNi4xNzg1TDEwLjkyMzEgMjQuMDc2MkwxMC45MjcxIDI0LjA3MjJaIiBmaWxsPSJ1cmwoI3BhaW50MF9yYWRpYWxfNDRfNjgwKSIvPgo8cGF0aCBpZD0iVmVjdG9yXzIiIGQ9Ik0zNi45MTE2IDEwLjA5NDVMMzQuNzk5NCA3Ljk4NDEzTDI4Ljk2MDggMTMuODE3NkwzMS4wNzMgMTUuOTI4QzMzLjMyNTcgMTguMTc4NyAzMy4zMjU3IDIxLjgyNTcgMzEuMDczIDI0LjA3MjRMMjMuODUzIDE2Ljg1ODhDMjIuMjM4NyAxNS4yNDU5IDE5LjYyNDYgMTUuMjQ1OSAxOC4wMTQ0IDE2Ljg1ODhDMTYuNDAwMSAxOC40NzE2IDE2LjQwMDEgMjEuMDgzNCAxOC4wMTQ0IDIyLjY5MjNMMjUuMjM0NCAyOS45MDU5TDI1LjA3NzggMzAuMDYyNEMyMi44MjUgMzIuMzEzMSAxOS4xNzQ5IDMyLjMxMzEgMTYuOTI2MSAzMC4wNjI0TDE0LjgwNTkgMjcuOTQ0TDguOTY3MjkgMzMuNzc3NUwxMS4wODc1IDM1Ljg5NTlDMTYuNTY0NyA0MS4zNjgzIDI1LjQ0MzIgNDEuMzY4MyAzMC45MjA0IDM1Ljg5NTlMMzEuMDc3IDM1LjczOTRMMzYuOTE1NyAyOS45MDU5QzQyLjM5MjkgMjQuNDMzNSA0Mi4zOTI5IDE1LjU2MjkgMzYuOTE1NyAxMC4wOTA0TDM2LjkxMTYgMTAuMDk0NVoiIGZpbGw9InVybCgjcGFpbnQxX3JhZGlhbF80NF82ODApIi8+CjwvZz4KPGRlZnM+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQwX3JhZGlhbF80NF82ODAiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYuOTkxOCA1LjI4NzEyKSByb3RhdGUoOTApIHNjYWxlKDIyLjM2MDEgMjIuMzg1NCkiPgo8c3RvcCBzdG9wLWNvbG9yPSIjNjZGRUYyIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwQ0ZEQyIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50MV9yYWRpYWxfNDRfNjgwIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDI0Ljk5NTQgMjMuOTkyMikgcm90YXRlKDkwKSBzY2FsZSgxNi4wMDggMTYuMDI4MikiPgo8c3RvcCBzdG9wLWNvbG9yPSIjQzdBNUVBIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzdENEJBMyIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=`;
  return element;
};
