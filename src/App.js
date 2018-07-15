import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';
import Home from './Home';
import MapDetails from './MapDetails';
import './MapDetails.css';

class App extends Component {
    render() {
        return (
            <Router>
                <div>
                    <Navigation/>
                    <div className="container-fluid body-content">
                        <div>
                            <Route exact path="/" component={Home}/>
                            <Route path="/map/:id" component={MapDetails}/>
                        </div>

                        <hr/>
                        <Footer/>
                    </div>
                </div>
            </Router>
        );
    }
}

export default App;
