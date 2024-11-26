const fs = require('fs');
const path = require('path');

const MORNING_SESSION_LIMIT = 180; // 3 horas (9:00 - 12:00)
const AFTERNOON_SESSION_MIN = 180; // 3 horas (13:00 - 16:00)
const AFTERNOON_SESSION_MAX = 240; // 4 horas (13:00 - 17:00)
const LIGHTNING_MINUTES = 5;

function parseTalks(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const lightning = line.includes('lightning');
      const duration = lightning
        ? LIGHTNING_MINUTES
        : parseInt(line.match(/\d+min$/)?.[0]?.replace('min', ''), 10);
      return {
        title: line.replace(/\d+min$|lightning$/, '').trim(),
        duration,
      };
    });
}

// Merge Sort para ordenar as palestras por duração decrescente
function mergeSort(array) {
  if (array.length <= 1) return array;

  const mid = Math.floor(array.length / 2);
  const left = mergeSort(array.slice(0, mid));
  const right = mergeSort(array.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  while (left.length && right.length) {
    if (left[0].duration > right[0].duration) {
      result.push(left.shift());
    } else {
      result.push(right.shift());
    }
  }
  return result.concat(left, right);
}

// Aloca as palestras em sessões respeitando os limites de tempo
function allocateSessions(talks) {
  const tracks = [];
  while (talks.length > 0) {
    const morningSession = fitSession(talks, MORNING_SESSION_LIMIT);
    const afternoonSession = fitSession(
      talks,
      AFTERNOON_SESSION_MAX,
      AFTERNOON_SESSION_MIN
    );

    tracks.push({
      morning: morningSession,
      afternoon: afternoonSession,
    });
  }
  return tracks;
}

// Ajusta as palestras dentro de uma sessão
function fitSession(talks, maxTime, minTime = 0) {
  const session = [];
  let totalTime = 0;

  for (let i = 0; i < talks.length; i++) {
    if (totalTime + talks[i].duration <= maxTime) {
      session.push(talks[i]);
      totalTime += talks[i].duration;
      talks.splice(i, 1); // Remove a palestra alocada
      i--; // Ajusta o índice após remoção
    }
  }

  // Retorna as palestras alocadas (não força atingir minTime)
  return session;
}

// Aloca as palestras em sessões respeitando os limites de tempo
function allocateSessions(talks) {
  const tracks = [];
  while (talks.length > 0) {
    // Aloca sessões de manhã e à tarde
    const morningSession = fitSession(talks, MORNING_SESSION_LIMIT);
    const afternoonSession = fitSession(talks, AFTERNOON_SESSION_MAX);

    // Adiciona track com as sessões
    tracks.push({
      morning: morningSession,
      afternoon: afternoonSession,
    });
  }
  return tracks;
}

// Formata o horário para exibição
function formatTime(startTime, minutesToAdd) {
  const hours = Math.floor(startTime / 60);
  const minutes = startTime % 60;
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}`;
  return { time, endTime: startTime + minutesToAdd };
}

// Imprime o cronograma
function printSchedule(tracks) {
  tracks.forEach((track, index) => {
    console.log(`Track ${index + 1}:`);
    let currentTime = 9 * 60; // 09:00

    track.morning.forEach((talk) => {
      const { time, endTime } = formatTime(currentTime, talk.duration);
      console.log(`${time} ${talk.title} ${talk.duration}min`);
      currentTime = endTime;
    });
    console.log('12:00 Almoço');

    currentTime = 13 * 60; // 13:00
    track.afternoon.forEach((talk) => {
      const { time, endTime } = formatTime(currentTime, talk.duration);
      console.log(`${time} ${talk.title} ${talk.duration}min`);
      currentTime = endTime;
    });
    console.log('16:00 Evento de Networking\n');
  });
}

function main() {
  const filePath = path.resolve(__dirname, 'mini_proposals.txt');
  const talks = parseTalks(filePath);

  // Ordena usando Merge Sort
  const sortedTalks = mergeSort(talks);

  // Aloca palestras em sessões e tracks
  const tracks = allocateSessions(sortedTalks);

  // Exibe o cronograma
  printSchedule(tracks);
}

main();
