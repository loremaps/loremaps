import React, {Component} from 'react';
import {Navbar, Nav, NavItem} from 'react-bootstrap'
import {Link} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';

class Navigation extends Component {
    render() {
        return (
            <Navbar fixedTop inverse>
                <Navbar.Header>
                    <Navbar.Brand>
                        <Link to="/" className="navbar-brand">LoreMaps</Link>
                    </Navbar.Brand>
                    <Navbar.Toggle/>
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <LinkContainer to="/map/2">
                            <NavItem eventKey={1}>Game Of Thrones
                            </NavItem>
                        </LinkContainer>
                        <LinkContainer to="/map/1">
                            <NavItem eventKey={2}>Faerun
                            </NavItem>
                        </LinkContainer>
                        <LinkContainer to="/map/3">
                            <NavItem eventKey={3}>WFI
                            </NavItem>
                        </LinkContainer>
                    </Nav>
                    <Nav pullRight>
                        <NavItem eventKey={1} href="#">
                            <i className="glyphicon glyphicon-cog" title="Settings" data-toggle="modal"
                               data-target="#userPreferencesModal"></i>
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

export default Navigation;