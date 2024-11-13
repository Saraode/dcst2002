// import React, { useEffect, useState } from 'react';
// import { NavBar } from './widgets';
// import axios from 'axios';

// type Campus = {
//   campusId: number;
//   name: string;
// };

// const Menu: React.FC = () => {
//   const [campuses, setCampuses] = useState<Campus[]>([]);

//   useEffect(() => {
//     axios.get('http://localhost:3000/api/campuses') // Endepunktet som henter campusnavn
//       .then((response) => {
//         setCampuses(response.data); // Oppdater campus-liste
//       })
//       .catch((error) => {
//         console.error('Error fetching campuses:', error);
//       });
//   }, []);

//   return (
//     <NavBar brand="NTNU">
//       {campuses.map((campus) => (
//         <NavBar.Link key={campus.campusId} to={`/campus/${campus.name}`}>
//           {campus.name}
//         </NavBar.Link>
//       )
//     </NavBar>
//   );
// };

// export default Menu;

