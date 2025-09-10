// 测试前端API调用
const axios = require('axios');

// 模拟前端的API配置
const http = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testFrontendAPI() {
  try {
    console.log('1. 测试登录API...');
    const loginResponse = await http.post('/auth/login', {
      username: 'apitest',
      password: '123456'
    });
    
    console.log('登录成功');
    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.access_token;
    console.log('Token:', token);
    
    console.log('\n2. 测试任务列表API（带认证头）...');
    const tasksResponse = await http.get('/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('任务列表API调用成功');
    console.log('状态码:', tasksResponse.status);
    console.log('任务数量:', tasksResponse.data.data.length);
    console.log('第一个任务:', JSON.stringify(tasksResponse.data.data[0], null, 2));
    
  } catch (error) {
    console.error('API调用失败:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('响应数据:', error.response.data);
    } else {
      console.log('错误信息:', error.message);
    }
  }
}

testFrontendAPI();