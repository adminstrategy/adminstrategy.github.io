(() => {
  'use strict';
  const root = document.getElementById('admin-site');
  if (!root) return;
  const menu = root.querySelector('.mobile-menu');
  if (menu) {
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
  }
  const form = root.querySelector('#consultForm');
  if (!form) return;
  const topics = {
    'business-certification': '기업 인증·진단',
    'business-planning': '사업계획·정책자금',
    visa: '외국인·비자', nonprofit: '비영리·단체',
    licensing: '인허가', 'fact-finding': '사실조사·자료 확인'
  };
  const key = new URLSearchParams(window.location.search).get('topic');
  const requestedTopic = Object.prototype.hasOwnProperty.call(topics, key) ? topics[key] : null;
  if (requestedTopic) form.elements.topic.value = requestedTopic;
  const button = document.getElementById('submitBtn');
  const note = document.getElementById('formNote');
  const newInquiry = document.getElementById('newInquiry');
  const initialNote = note.textContent;
  let pending = false;
  let completed = false;
  newInquiry.addEventListener('click', () => {
    if (pending) return;
    form.reset();
    if (requestedTopic) form.elements.topic.value = requestedTopic;
    completed = false;
    button.disabled = false;
    button.textContent = '상담신청';
    note.textContent = initialNote;
    delete note.dataset.state;
    newInquiry.hidden = true;
    form.elements.name.focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || completed) return;
    pending = true;
    button.disabled = true;
    button.textContent = '전송 중…';
    form.setAttribute('aria-busy', 'true');
    note.textContent = '상담신청을 전송하고 있습니다.';
    delete note.dataset.state;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { Accept: 'application/json' },
        body: new FormData(form), signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data.success) throw new Error('Submission failed');
      completed = true;
      button.textContent = '전송 완료';
      newInquiry.hidden = false;
      note.textContent = '상담신청이 접수되었습니다. 내용을 확인한 뒤 연락드리겠습니다.';
      note.dataset.state = 'success';
    } catch (error) {
      button.disabled = false;
      button.textContent = '상담신청';
      note.textContent = error.name === 'AbortError'
        ? '응답 시간이 초과되었습니다. 접수 여부는 전화로 확인해 주세요: 0507-1359-8568'
        : '전송하지 못했습니다. 다시 시도하거나 전화로 문의해 주세요: 0507-1359-8568';
      note.dataset.state = 'error';
    } finally {
      clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
    }
  });
})();
