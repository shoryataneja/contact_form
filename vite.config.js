import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Fail the build instead of throwing in the browser at runtime.
  if (!env.VITE_CONTACT_ENDPOINT || !/^https:\/\//i.test(env.VITE_CONTACT_ENDPOINT)) {
    throw new Error(
      "VITE_CONTACT_ENDPOINT must be set and use https://. Add it to .env or your host's environment variables.",
    )
  }

  return {
    plugins: [react()],
  }
})
