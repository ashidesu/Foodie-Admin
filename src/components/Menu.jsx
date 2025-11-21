
import LeftSidebar from "./left-sidebar"
import MenuPage from './menu-page'
import '../styles/general.css'
const Menu = () => {
    return (
        <div className = "container">
            <LeftSidebar />
            <div className = "main-content">
            <MenuPage />

            </div>
        </div>
    )
}

export default Menu;