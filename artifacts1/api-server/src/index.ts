import dotenv from "dotenv";

dotenv.config({
  path: new URL("../.env", import.meta.url),
});

const [{ default: app }, { sendDuePushJobs }] = await Promise.all([
  import("./app"),
  import("./routes/push"),
]);

const rawPort = process.env["PORT"];

const port = rawPort ? Number(rawPort) : 3001;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort ?? "(not set)"}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  // Run push job scheduler every 60 seconds
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    setInterval(() => {
      sendDuePushJobs().catch((err) => console.error("[push-scheduler]", err));
    }, 60_000);
    // Run immediately on start to catch any missed jobs
    sendDuePushJobs().catch((err) => console.error("[push-scheduler-init]", err));
  }
});
