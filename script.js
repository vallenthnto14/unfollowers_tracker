document.getElementById('unfollowersForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const followersFile = document.getElementById('followersFile').files[0];
    const followingFile = document.getElementById('followingFile').files[0];

    if (!followersFile || !followingFile) {
        alert('Please upload both files.');
        return;
    }

    try {
        const followers = await processFile(followersFile);
        const following = await processFile(followingFile);

        if (!followers || !following) {
            throw new Error('Invalid file structure. Please check the uploaded files.');
        }

        const unfollowers = following.filter(user => !followers.includes(user));

        // Save unfollowers data to localStorage
        const unfollowersData = unfollowers.map(username => ({
            username,
            profileLink: `https://www.instagram.com/${username}/`,
        }));
        localStorage.setItem('unfollowers', JSON.stringify(unfollowersData));

        // Debugging: Ensure data is saved correctly
        console.log('Unfollowers saved to localStorage:', unfollowersData);

        // Redirect to result.html
        window.location.href = 'result.html';
    } catch (error) {
        console.error('Error processing files:', error.message);
        alert('Failed to process files. Please ensure the structure is correct.');
    }
});

async function processFile(file) {
    const content = await file.text();

    if (file.name.endsWith('.json')) {
        return extractFromJSON(content);
    } else if (file.name.endsWith('.html')) {
        return extractFromHTML(content);
    } else {
        throw new Error('Unsupported file type.');
    }
}

function extractFromJSON(content) {
    try {
        const data = JSON.parse(content);
        const result = [];

        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item.string_list_data) {
                    item.string_list_data.forEach(subItem => {
                        if (subItem.value) result.push(subItem.value);
                    });
                }
            });
        } else if (data.relationships_following) {
            data.relationships_following.forEach(item => {
                if (item.string_list_data) {
                    item.string_list_data.forEach(subItem => {
                        if (subItem.value) result.push(subItem.value);
                    });
                }
            });
        } else {
            // Attempt other possible formats
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    data[key].forEach(subItem => {
                        if (subItem.string_list_data) {
                            subItem.string_list_data.forEach(item => {
                                if (item.value) result.push(item.value);
                            });
                        }
                    });
                }
            }
        }

        return result;
    } catch (error) {
        console.error('Invalid JSON structure:', error.message);
        return null;
    }
}

function extractFromHTML(content) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const userElements = doc.querySelectorAll('.user');
        return Array.from(userElements).map(el => el.textContent.trim());
    } catch (error) {
        console.error('Invalid HTML structure:', error.message);
        return null;
    }
}

if (window.location.pathname.endsWith('result.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const unfollowers = JSON.parse(localStorage.getItem('unfollowers')) || [];
        console.log('Unfollowers data:', unfollowers); // Debugging

        const unfollowersList = document.getElementById('unfollowersList');

        if (unfollowers.length === 0) {
            unfollowersList.innerHTML = '<li class="list-group-item text-center">No data available</li>';
        } else {
            unfollowers.forEach(({ username, profileLink }) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

                const usernameSpan = document.createElement('span');
                usernameSpan.textContent = username;

                const profileButton = document.createElement('a');
                profileButton.href = profileLink;
                profileButton.textContent = 'View Profile';
                profileButton.className = 'btn btn-info';
                profileButton.target = '_blank';

                listItem.appendChild(usernameSpan);
                listItem.appendChild(profileButton);

                unfollowersList.appendChild(listItem);
            });
        }

        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.clear();
            alert('You have successfully logged out. All uploaded data has been cleared.');
            window.location.href = 'index.html';
        });
    });
                                }
