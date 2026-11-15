export type UpdateCheckResult = "updated" | "current" | "unsupported" | "offline";

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  if (!("serviceWorker" in navigator)) return "unsupported";
  if (!navigator.onLine) return "offline";

  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return "unsupported";

  let updateFound = false;
  const markUpdate = () => { updateFound = true; };
  registration.addEventListener("updatefound", markUpdate, { once: true });
  await registration.update();

  const worker = registration.installing ?? registration.waiting;
  if (worker) {
    updateFound = true;
    if (worker.state !== "installed" && worker.state !== "activated") {
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 8_000);
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" || worker.state === "activated" || worker.state === "redundant") {
            window.clearTimeout(timeout); resolve();
          }
        });
      });
    }
  }

  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  return updateFound ? "updated" : "current";
}
