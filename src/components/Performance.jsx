
import LeftSidebar from "./left-sidebar"
import PerformancePage from './performance-page'
import '../styles/performance-page.css'
import '../styles/general.css'
const Performance = () => {
    return (
        <div className="container">
            <LeftSidebar />
            <div className="main-content">
                <PerformancePage />
            </div>
        </div>
    )
}

export default Performance;