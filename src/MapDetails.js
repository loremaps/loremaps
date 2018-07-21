import React, { Component } from "react";
import maps from "./data/maps";
import FantasyMap from "./FantasyMap";

class MapDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null
    };
  }

  componentDidMount() {
    const map = maps.find(x => x.id === this.props.match.params.id);
    this.init(map);
  }

  componentDidUpdate(prevProps) {
    const oldId = prevProps.match.params.id;
    const newId = this.props.match.params.id;
    if (newId !== oldId) {
      const map = maps.find(x => x.id === this.props.match.params.id);
      this.init(map);
    }
  }

  init(map) {
    if (this.state.map) {
      this.state.map.remove();
      this.setState({ map: null });
    }

    const fantasyMap = new FantasyMap();
    fantasyMap.initialize(map);
    this.setState({ map: fantasyMap });
  }
  render() {
    return (
      <div>
        <div id="sidebar" />
        <div className="map" id="map" />
      </div>
    );
  }
}

export default MapDetails;
