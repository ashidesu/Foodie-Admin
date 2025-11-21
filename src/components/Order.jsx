
import LeftSidebar from "./left-sidebar"
import OrderPage from './order-page'
import '../styles/general.css'
const Menu = () => {
    return (
        <div className="container">
            <LeftSidebar />
            <div className="main-content">
                <OrderPage />
            </div>
        </div>
    )
}

export default Menu;