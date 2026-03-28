import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';

export async function checkBackendHealth() {
	const response = await axios.get(`${BASE_URL}/health`);
	return response.data;
}

export async function findSimilarFiles(
	queryFilePath: string,
	candidateFilePaths: string[],
	topK: number = 3
) {
	const response = await axios.post(`${BASE_URL}/find-similar-files`, {
		query_file_path: queryFilePath,
		candidate_file_paths: candidateFilePaths,
		top_k: topK
	});

	return response.data;
}