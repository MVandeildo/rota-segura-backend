const axios = require("axios");

/**
 * Calcula a estimativa de tempo e distância entre a localização atual do veículo e o destino.
 * Utiliza o serviço de roteamento OSRM (Open Source Routing Machine).
 * 
 * @param {number} origemLat - Latitude atual do veículo
 * @param {number} origemLng - Longitude atual do veículo
 * @param {number} destinoLat - Latitude do destino/parada do aluno
 * @param {number} destinoLng - Longitude do destino/parada do aluno
 * @returns {Promise<{duracaoMinutos: number, distanciaKm: string, etaTexto: string}>}
 */
async function calcularETA(origemLat, origemLng, destinoLat, destinoLng) {
    try {
        if (!origemLat || !origemLng || !destinoLat || !destinoLng) {
            throw new Error("Coordenadas de origem e destino são obrigatórias.");
        }

        // OSRM utiliza o formato: {longitude},{latitude};{longitude},{latitude}
        const url = `http://router.project-osrm.org/route/v1/driving/${origemLng},${origemLat};${destinoLng},${destinoLat}?overview=false`;

        const response = await axios.get(url);

        if (!response.data || !response.data.routes || response.data.routes.length === 0) {
            throw new Error("Não foi possível calcular a rota para as coordenadas fornecidas.");
        }

        const route = response.data.routes[0];
        
        // Duração em segundos convertida para minutos
        const duracaoSegundos = route.duration;
        const duracaoMinutos = Math.ceil(duracaoSegundos / 60);

        // Distância em metros convertida para km
        const distanciaKm = (route.distance / 1000).toFixed(2);

        return {
            duracaoMinutos,
            distanciaKm: `${distanciaKm} km`,
            etaTexto: duracaoMinutos < 1 ? "Menos de 1 min" : `${duracaoMinutos} min`
        };
    } catch (error) {
        console.error("Erro ao calcular ETA via OSRM:", error.message);
        return {
            duracaoMinutos: null,
            distanciaKm: null,
            etaTexto: "Indisponível"
        };
    }
}

module.exports = {
    calcularETA
};