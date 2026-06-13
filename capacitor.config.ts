import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.woolini.app",
  appName: "Woolini Study Planner",
  webDir: "out",
  server: {
    // [개발 모드 설정]
    // 1. Android 에뮬레이터에서 실행할 경우: "http://10.0.2.2:3000"
    // 2. iOS 시뮬레이터에서 실행할 경우: "http://localhost:3000"
    // 3. 실제 모바일 기기(Wi-Fi 연결): "http://PC의_IP주소:3000" (예: http://192.168.0.5:3000)
    // 4. 배포 시: 실제 배포된 URL (예: https://woolini.vercel.app)
    url: "https://oss-project-seven.vercel.app",
    cleartext: true,
  },
};

export default config;
