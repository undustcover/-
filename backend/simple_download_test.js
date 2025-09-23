const axios = require('axios');

async function testDownload() {
  try {
    console.log('🔧 简单下载测试：验证Content-Disposition修复');
    
    // 1. 登录
    console.log('1. 登录系统...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ 登录成功');
    
    // 2. 获取文件列表
    console.log('\n2. 获取文件列表...');
    const filesResponse = await axios.get('http://localhost:3000/api/files', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const response = filesResponse.data;
    console.log('文件列表响应:', response);
    
    const files = response.files || [];
    
    if (files.length === 0) {
      console.log('❌ 没有文件可供测试，需要先上传一个测试文件');
      return;
    }
    
    console.log(`✅ 找到 ${files.length} 个文件`);
    
    // 3. 测试下载第一个文件
    const testFile = files[0];
    console.log(`\n3. 测试下载文件: ${testFile.original_name} (ID: ${testFile.id})`);
    
    try {
      const downloadResponse = await axios.get(`http://localhost:3000/api/files/download/${testFile.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'stream'
      });
      
      console.log('✅ 下载成功!');
      console.log('📋 响应头信息:');
      console.log('   Content-Disposition:', downloadResponse.headers['content-disposition']);
      console.log('   Content-Type:', downloadResponse.headers['content-type']);
      
      // 检查Content-Disposition是否包含问题字符
      const contentDisposition = downloadResponse.headers['content-disposition'];
      if (contentDisposition) {
        const hasNewline = /[\r\n]/.test(contentDisposition);
        const hasTab = /\t/.test(contentDisposition);
        const hasControlChars = /[\x00-\x1f\x7f-\x9f]/.test(contentDisposition);
        
        console.log('\n🔍 Content-Disposition 检查:');
        console.log('   包含换行符:', hasNewline ? '❌ 是' : '✅ 否');
        console.log('   包含制表符:', hasTab ? '❌ 是' : '✅ 否');
        console.log('   包含控制字符:', hasControlChars ? '❌ 是' : '✅ 否');
        
        if (!hasNewline && !hasTab && !hasControlChars) {
          console.log('\n🎉 Content-Disposition 头部清理成功！');
        } else {
          console.log('\n⚠️  Content-Disposition 头部仍有问题字符');
        }
      }
      
    } catch (downloadError) {
      console.log('❌ 下载失败:', downloadError.response?.status, downloadError.response?.data || downloadError.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testDownload();