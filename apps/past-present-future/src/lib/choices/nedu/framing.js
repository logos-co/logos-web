/* Where the portrait window looks in each clip: [time s, x % of the video width] keyframes in the
   format of reframe-data.js; two keys at the same time are a jump at a real cut, two at different
   times an eased pan. The window keeps the film's own centre unless the speaking face would be cut,
   and then moves only as far as that face needs, on a still camera, never while the camera itself
   moves. Clips not listed stay centred, as in the original. */
const KEYS = {
    "scene-1": [[0, 38], [20.1, 38], [20.9, 51]],
    "scene-2": [[0, 57]],
    "scene-3": [[0, 32], [5.27, 32], [6.27, 68], [8.05, 68], [9, 35], [9.1, 35], [10.1, 59]],
    "scene-4": [[0, 46.5], [13.6, 46.5], [14.5, 65], [19.1, 65], [19.9, 50], [23, 50], [23.85, 64.5], [26, 64.5], [26.8, 50]],
    "scene-5": [[0, 50], [8.9, 50], [9.75, 70], [11.6, 70], [12.4, 50], [16.85, 50], [17.75, 72], [19.6, 72], [20.4, 50], [24.9, 50], [25.8, 72]],
    "br-2b": [[0, 50], [4.417, 50], [4.417, 54]],
    "br-3b": [[0, 61], [12.042, 61], [12.042, 50]],
    "br-4a": [[0, 49.5], [9.958, 49.5], [9.958, 58]],
    "br-4b": [[0, 48], [7.042, 48], [7.042, 50]],
    "br-5b": [[0, 68]],
};

export const framingFor = (name) => KEYS[name];
