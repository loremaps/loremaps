import React, {Component} from 'react';
import faerunImage from './images/Maps/faerunlarge700x400.jpg';
import gotImage from './images/Maps/GoT_speculative_map700x400.jpg';
import loreMapsLogo from './images/LoreMaps_Logo.png';
import './App.css';
import {Link} from 'react-router-dom';


class Home extends Component {
    render() {
        return (
            <div className="container">

                <div className="row page-header">
                    <div className="col-xs-12 col-sm-6 v-align">
                        <h1><img className="img-responsive" src={loreMapsLogo} alt="LoreMaps"/></h1>
                    </div>
                    <div className="col-xs-12 col-sm-6 v-align">
                        <h2>
                            <small>Interactive fantasy maps</small>
                        </h2>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <p>LoreMaps is an attempt to help organize information on fantasy maps. With LoreMaps
                            you easily
                            complete the following activities on the fantasy world you are interested in
                        </p>
                            <ul>
                                <li>Search a POI by name</li>
                                <li>Find information about a POI</li>
                                <li>Create your own bookmarks</li>
                                <li>Measure distance</li>
                                <li>Overlay hexagons (HexGrid) on the map</li>
                                <li>Export portion of the map to jpeg</li>
                                <li>More coming soon...</li>
                            </ul>
                        <p>The project is still in early alpha release, so we would really appreciate any
                            feedback you can
                            send either issues or improvement suggestions. Please send your feedback to <a
                                href="mailto:LoreAndMaps@gmail.com">LoreAndMaps@gmail.com</a>.</p>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 portfolio-item">
                        <Link to="/map/2">
                            <img className="img-responsive" src={gotImage}
                                 alt="Game of Thrones map"></img>
                        </Link>
                        <h3>
                            <Link to="/map/2">Game Of Thrones</Link>
                        </h3>
                        <p>Explore the fantasy world of George R. R. Martin's fantasy series <i>Song of Ice and
                            Fire</i>.
                        </p>
                    </div>

                    <div className="col-md-6 portfolio-item">
                        <Link to="/map/1">
                            <img className="img-responsive" src={faerunImage} alt="Faerun Map"></img>
                        </Link>
                        <h3>
                            <Link to="/map/1">Faerun</Link>
                        </h3>
                        <p>Explore the primary setting of the <i>Dungeons & Dragons</i> world of <i>Forgotten
                            Realms</i>.
                        </p>
                    </div>
                </div>

            </div>
        );
    }
}

export default Home;
