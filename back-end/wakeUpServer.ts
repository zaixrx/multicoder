import axios from "axios";

// Used to not let the server shut down after 5 minutes.
export function wakeUpServer(url: string) {
  setInterval(async () => {
    try {
      await axios.get(url);
      console.log("Server Wake Up");
    } catch (error) {
      console.error(error);
    }
  }, 15 * 60 * 1000);
}
