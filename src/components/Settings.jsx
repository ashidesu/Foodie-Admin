
import LeftSidebar from "./left-sidebar"
import SettingsPage from './settings-page'
import '../styles/general.css'
const Settings = () => {
    return (
        <div className="container">
            <LeftSidebar />
            <div className="main-content">
                <SettingsPage />
            </div>
        </div>
    )
}

export default Settings;