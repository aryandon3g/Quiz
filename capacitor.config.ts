import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.quizapp.local',
    appName: 'Quiz App',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
