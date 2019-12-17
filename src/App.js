import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          {plans.map((plan, index) => (
            <Plan key={index} {...plan} />
          ))}
        </div>
      </header>
    </div>
  );
}


const absExercise = {
  name: "Legs up machine", weight: 10, reps: 10, sets: 3,
  img: 'https://www.verywellfit.com/thmb/MKsWT4vfj2mrWokgfUH6wF6YkfI=/768x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/42-3498291-Captains-Chair-Leg-Raises-GIF-a2f30dc759fe474c94893c8bd19abecb.gif'
}
const aPlan = {
  abs: [absExercise],
  cheast: [
    { name: "benchpress", weight: 50 },
    { name: "butterfly on bench", weight: 30 },
    { name: "push on bench", weight: 30 }
  ],
  "back arm": [
    { name: "arm spread machine" },
    { name: "arm spread free", weight: 10 }
  ],
  sholders: [
    { name: "standing push bar", weight: 20 },
    { name: "dumble straight", weight: 10 },
    { name: "dumble side", weight: 10 }
  ]
};
const bPlan = {
  abs: [absExercise],
  legs: [{ name: "squat", weight: 50 }, { name: "tip toe" }],
  back: [
    { name: "dead lift", weight: 100 },
    { name: "pull up", weight: 10 },
    { name: "bench pull up over head", weight: 30 }
  ],
  "front hand": [
    { name: "standing push bar", weight: 20 },
    { name: "dumble straight", weight: 10 },
    { name: "dumble side", weight: 10 }
  ]
};
const plans = [{ name: "A", plan: aPlan }, { name: "B", plan: bPlan }];

function Plan({ name, plan }) {
  return (
    <table>
      <thead>
        <tr>
          <th colSpan={5}>{name}</th>
        </tr>
        <tr>
          <th rowSpan={2}>Group</th>
          <th rowSpan={2}>Exercise</th>
          <th colSpan={3}>Power</th>
        </tr>
        <tr>
          <th>Reps</th>
          <th>Sets</th>
          <th>Weight</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(plan).map((group, index) => (
          <Group key={group} exercises={plan[group]} group={group} even={index % 2 === 1} />
        ))}
      </tbody>
    </table>
  );
}

function Group({ group, exercises, even = false }) {
  return (
    <>
      {exercises.map((exercise, index) => (
        <Exercise
            key={exercise.name}
          {...exercise}
          group={group}
          exercisesInGroup={index === 0 ? exercises.length : undefined}
          even={even}
        />
      ))}
    </>
  );
}

function Exercise({
  group,
  exercisesInGroup,
  name,
  weight = 0,
  even = false,
  reps = 1,
  sets = 1
}) {
  return (
    <tr className={even ? "evenGroup" : "oddGroup"}>
      {exercisesInGroup && <td rowSpan={exercisesInGroup}>{group}</td>}

      <td>{name}</td>
      <td>{`${reps}`}</td>
      <td>{`${sets}`}</td>
      <td>{`${weight}`}Kg</td>
    </tr>
  );
}

export default App;
