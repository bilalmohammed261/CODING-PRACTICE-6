const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dBPath = path.join(__dirname, "covid19India.db");
let dBObj = null;
app.use(express.json());
//console.log(dBPath);

const connectToDBAndStartServer = async () => {
  try {
    dBObj = await open({ filename: dBPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log(
        "Server started listening to requests on http://localhost:3000/"
      );
      //console.log(dBObj);
    });
  } catch (e) {
    console.log(`Error message is: ${e.message}`);
    process.exit(1);
  }
};

connectToDBAndStartServer();

const camelToSnakeCase = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const camelToSnakeCase1 = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  const stateQuery = `SELECT * FROM state;`;
  const stateList = await dBObj.all(stateQuery);
  response.send(stateList.map((obj) => camelToSnakeCase(obj)));
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `SELECT * FROM state
   WHERE state_id = ${stateId};`;
  const state = await dBObj.get(getQuery);
  response.send(camelToSnakeCase(state));
});

//API 3

app.post("/districts/", async (request, response) => {
  //console.log(request.body);

  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  //console.log(cases);

  const addDistrictQuery = `INSERT INTO district (district_name,state_id,
    cases,cured,active,deaths)
   VALUES('${districtName}',${stateId},${cases},
   ${cured},${active},${deaths});`;
  console.log(addDistrictQuery);

  await dBObj.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district
   WHERE district_id = ${districtId};`;
  const district = await dBObj.get(getDistrictQuery);
  response.send(camelToSnakeCase1(district));
});

//API5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const removeDistrictQuery = `DELETE  FROM district
   WHERE district_id = ${districtId};`;
  await dBObj.run(removeDistrictQuery);
  response.send("District Removed");
});

//API6

app.put("/districts/:districtId/", async (request, response) => {
  //console.log(request.body);
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  //console.log(cases);

  const updateDistrictQuery = `UPDATE  district 
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured =  ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_Id = ${districtId}    
 ;`;
  // console.log(addDistrictQuery);

  await dBObj.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  // console.log(request.params);
  const { stateId } = request.params;
  const getStatsQuery = `SELECT SUM(cases) AS  totalCases,
   SUM(cured) AS  totalCured,SUM(active) AS  totalActive
   ,SUM(deaths) AS  totalDeaths FROM district
   WHERE state_id=${stateId}
   ;`;
  const statsResult = await dBObj.get(getStatsQuery);
  response.send({
    totalCases: statsResult.totalCases,
    totalCured: statsResult.totalCured,
    totalActive: statsResult.totalActive,
    totalDeaths: statsResult.totalDeaths,
  });
});

//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const lastQuery = `SELECT state.state_name
    AS stateName FROM
    state INNER JOIN district ON
     state.state_id = district.state_id
     WHERE district.district_id =${districtId};`;
  const result = await dBObj.get(lastQuery);
  response.send(result);
});

module.exports = app;
