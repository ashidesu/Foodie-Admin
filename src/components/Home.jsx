import LeftSidebar from "./left-sidebar"
import HomePage from './home-page'
import '../styles/general.css'
const Home = () => {
    return (
        <div className = "container">
            <LeftSidebar />
            <div className = "main-content">
            <HomePage />
            </div>
        </div>
    )
}

export default Home;